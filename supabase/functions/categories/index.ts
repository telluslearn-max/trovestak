import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET /categories - Get megamenu structure
    if (req.method === 'GET') {
      const { data: categories, error } = await supabase
        .from('megamenu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Build hierarchy
      const rootCategories = categories?.filter(c => !c.parent_id) || [];
      const subcategories: Record<string, typeof categories> = {};
      
      categories?.forEach(cat => {
        if (cat.parent_id) {
          const parent = categories.find(c => c.id === cat.parent_id);
          if (parent) {
            if (!subcategories[parent.slug]) {
              subcategories[parent.slug] = [];
            }
            subcategories[parent.slug].push(cat);
          }
        }
      });
      
      return new Response(JSON.stringify({
        categories: rootCategories,
        subcategories
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // POST /categories - Create category
    if (req.method === 'POST') {
      const categoryData = await req.json();
      
      const { data, error } = await supabase
        .from('megamenu_categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
