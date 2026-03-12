import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, serviceKey)

    let body
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    
    const { userId, cartProductIds = [] } = body

    // Helper to get fallback products
    const getFallback = async () => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, slug, thumbnail_url, product_variants(id, price_kes, stock_quantity), categories(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (error) throw error
      
      return (data || []).map(p => ({
        ...p,
        recommendation_reason: 'popular',
        match_strength: 0.5
      }))
    }

    // 1. Get owned devices for the user
    let ownedProductIds: string[] = []
    if (userId) {
      const { data: devices, error: deviceError } = await supabaseClient
        .from('user_device')
        .select('product_id')
        .eq('user_id', userId)
        .eq('is_active', true)
      
      if (deviceError) console.error('Device query error:', deviceError)
      ownedProductIds = devices?.map((d: any) => d.product_id) || []
    }

    // 2. Combine owned and in-cart as the "Context Set"
    const contextIds = [...new Set([...ownedProductIds, ...cartProductIds].filter(Boolean))]
    
    if (contextIds.length === 0) {
      const fallback = await getFallback()
      return new Response(JSON.stringify({ recommendations: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Find missing nodes in the mesh graph
    const { data: relations, error: relationError } = await supabaseClient
      .from('product_relation')
      .select('to_product_id, relation_type, strength, from_product_id')
      .in('from_product_id', contextIds)
      .not('to_product_id', 'in', `(${contextIds.join(',')})`)
      .order('strength', { ascending: false })
      .limit(10)

    if (relationError) {
      console.error('Relation query error:', relationError)
      const fallback = await getFallback()
      return new Response(JSON.stringify({ recommendations: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 4. Deduplicate recommendations and fetch metadata
    const recIds = [...new Set(relations?.map((r: any) => r.to_product_id) || [])].slice(0, 3)
    
    if (recIds.length === 0) {
      const fallback = await getFallback()
      return new Response(JSON.stringify({ recommendations: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data: recommendations, error: productError } = await supabaseClient
      .from('products')
      .select('id, name, slug, thumbnail_url, product_variants(id, price_kes, stock_quantity), categories(name, slug)')
      .in('id', recIds)

    if (productError) {
      console.error('Product query error:', productError)
      const fallback = await getFallback()
      return new Response(JSON.stringify({ recommendations: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 5. Enhance with "Reason" metadata from the first relation found
    const enhancedRecs = recommendations?.map(prod => {
      const relation = relations?.find((r: any) => r.to_product_id === prod.id)
      return {
        ...prod,
        recommendation_reason: relation?.relation_type || 'compatible_with',
        match_strength: relation?.strength || 0.5
      }
    }) || []

    return new Response(JSON.stringify({ recommendations: enhancedRecs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Edge function error:', error)
    // Return 200 with empty recommendations instead of error
    return new Response(JSON.stringify({ 
      recommendations: [],
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
