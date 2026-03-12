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

    const body = await req.json();
    const { products } = body;
    
    if (!products || !Array.isArray(products)) {
      return new Response(JSON.stringify({ error: 'Products array required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const product of products) {
      try {
        // Insert product
        const { data: insertedProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: product.product.name,
            slug: product.product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            short_name: product.product.short_name,
            subtitle: product.product.subtitle,
            description: product.content.overview,
            nav_category: product.product.category,
            nav_subcategory: product.product.subcategory,
            brand_type: product.product.brand_type,
            badge: product.product.badge,
            warranty: product.product.warranty,
            availability: product.availability,
            seo_title: `${product.product.name} | Trovestak Kenya`,
            seo_description: product.content.overview?.substring(0, 160) || '',
            is_active: true
          })
          .select()
          .single();

        if (productError) throw productError;

        // Insert pricing
        await supabase
          .from('product_pricing')
          .insert({
            product_id: insertedProduct.id,
            cost_price: product.pricing.cost_price || 0,
            sell_price: product.pricing.sell_price || 0,
            discount_percent: product.pricing.discount_percent || 0,
            compare_price: product.pricing.compare_price,
            currency: 'KES'
          });

        // Insert specs
        if (product.content.specs) {
          await supabase
            .from('product_specs')
            .insert({
              product_id: insertedProduct.id,
              spec_data: product.content.specs
            });
        }

        // Insert content
        await supabase
          .from('product_content')
          .insert({
            product_id: insertedProduct.id,
            overview: product.content.overview,
            features: product.content.features || [],
            faq: product.content.faq || []
          });

        // Insert addons
        if (product.addons) {
          const addonsToInsert = [];
          
          if (product.addons.bnpl) {
            addonsToInsert.push({ product_id: insertedProduct.id, addon_type: 'bnpl', is_enabled: true });
          }
          if (product.addons.trade_in) {
            addonsToInsert.push({ product_id: insertedProduct.id, addon_type: 'trade_in', is_enabled: true });
          }
          if (product.addons.shipping) {
            addonsToInsert.push({ product_id: insertedProduct.id, addon_type: 'shipping', is_enabled: true });
          }
          if (product.addons.insurance) {
            addonsToInsert.push({ product_id: insertedProduct.id, addon_type: 'insurance', is_enabled: true });
          }
          
          if (addonsToInsert.length > 0) {
            await supabase.from('product_addons').insert(addonsToInsert);
          }
        }

        // Insert variants (colors)
        if (product.variants.colors && product.variants.colors.length > 0) {
          const colorsToInsert = product.variants.colors.map((color: any) => ({
            product_id: insertedProduct.id,
            variant_type: 'color',
            variant_name: color.name,
            hex_primary: color.hex,
            hex_secondary: color.hex2,
            is_default: true
          }));
          
          await supabase.from('product_variants_detail').insert(colorsToInsert);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${product.product?.name || 'Unknown'}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
