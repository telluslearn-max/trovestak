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

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // GET /products - List all products
    if (req.method === 'GET' && (path.length === 1 && path[0] === 'products')) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (category) {
        query = query.eq('nav_category', category);
      }
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        products: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // GET /products/:slug - Get single product
    if (req.method === 'GET' && path.length === 2 && path[0] === 'products') {
      const slug = path[1];
      
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error || !product) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        });
      }
      
      // Get pricing
      const { data: pricing } = await supabase
        .from('product_pricing')
        .select('*')
        .eq('product_id', product.id)
        .single();
      
      // Get variants
      const { data: variants } = await supabase
        .from('product_variants_detail')
        .select('*')
        .eq('product_id', product.id);
      
      // Get specs
      const { data: specs } = await supabase
        .from('product_specs')
        .select('*')
        .eq('product_id', product.id)
        .single();
      
      // Get content
      const { data: content } = await supabase
        .from('product_content')
        .select('*')
        .eq('product_id', product.id)
        .single();
      
      // Get addons
      const { data: addons } = await supabase
        .from('product_addons')
        .select('*')
        .eq('product_id', product.id);
      
      return new Response(JSON.stringify({
        product,
        pricing: pricing || { sell_price: 0, cost_price: 0, discount_percent: 0 },
        variants: {
          colors: variants?.filter(v => v.variant_type === 'color') || [],
          sizes: variants?.filter(v => v.variant_type === 'size') || [],
          tiers: variants?.filter(v => v.variant_type === 'tier') || []
        },
        specs: specs?.spec_data || {},
        content: content || { features: [], faq: [], overview: '' },
        addons: addons || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // POST /products - Create product
    if (req.method === 'POST' && path.length === 1 && path[0] === 'products') {
      const productData = await req.json();
      
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      });
    }
    
    // PUT /products/:id - Update product
    if (req.method === 'PUT' && path.length === 2 && path[0] === 'products') {
      const productId = path[1];
      const productData = await req.json();
      
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // DELETE /products/:id - Delete product
    if (req.method === 'DELETE' && path.length === 2 && path[0] === 'products') {
      const productId = path[1];
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // 404 for unmatched routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
