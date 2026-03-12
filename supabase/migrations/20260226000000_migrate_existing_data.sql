-- Migrate existing data to new tables
-- Run this to populate product_pricing, product_content, product_specs, product_addons from existing data

-- 1. Migrate pricing from product_variants to product_pricing
INSERT INTO public.product_pricing (product_id, sell_price, cost_price, discount_percent, currency)
SELECT 
    pv.product_id,
    pv.price_kes / 100, -- Convert from cents to KES
    (pv.price_kes / 100) * 0.7, -- Assume 30% margin as cost
    0,
    'KES'
FROM public.product_variants pv
WHERE pv.product_id IS NOT NULL
ON CONFLICT (product_id) DO NOTHING;

-- 2. Create default content for products without content
INSERT INTO public.product_content (product_id, overview, features, faq, gallery)
SELECT 
    p.id,
    p.description || ' - Buy now at Trovestak Kenya.',
    '[]',
    '[]',
    '[]'
FROM public.products p
LEFT JOIN public.product_content pc ON pc.product_id = p.id
WHERE pc.id IS NULL
ON CONFLICT (product_id) DO NOTHING;

-- 3. Create default specs for products without specs
INSERT INTO public.product_specs (product_id, spec_data, spec_category)
SELECT 
    p.id,
    '{}',
    p.nav_category
FROM public.products p
LEFT JOIN public.product_specs ps ON ps.product_id = p.id
WHERE ps.id IS NULL
ON CONFLICT (product_id) DO NOTHING;

-- 4. Create default addons for products without addons
INSERT INTO public.product_addons (product_id, addon_type, is_enabled, config)
SELECT 
    p.id,
    'bnpl',
    CASE WHEN (SELECT price_kes FROM product_variants WHERE product_id = p.id LIMIT 1) >= 1500000 THEN true ELSE false END,
    '{}'
FROM public.products p
LEFT JOIN public.product_addons pa ON pa.product_id = p.id AND pa.addon_type = 'bnpl'
WHERE pa.id IS NULL;

INSERT INTO public.product_addons (product_id, addon_type, is_enabled, config)
SELECT 
    p.id,
    'trade_in',
    true,
    '{}'
FROM public.products p
LEFT JOIN public.product_addons pa ON pa.product_id = p.id AND pa.addon_type = 'trade_in'
WHERE pa.id IS NULL;

INSERT INTO public.product_addons (product_id, addon_type, is_enabled, config)
SELECT 
    p.id,
    'shipping',
    true,
    '{}'
FROM public.products p
LEFT JOIN public.product_addons pa ON pa.product_id = p.id AND pa.addon_type = 'shipping'
WHERE pa.id IS NULL;

INSERT INTO public.product_addons (product_id, addon_type, is_enabled, config)
SELECT 
    p.id,
    'insurance',
    CASE WHEN (SELECT price_kes FROM product_variants WHERE product_id = p.id LIMIT 1) >= 1000000 THEN true ELSE false END,
    '{}'
FROM public.products p
LEFT JOIN public.product_addons pa ON pa.product_id = p.id AND pa.addon_type = 'insurance'
WHERE pa.id IS NULL;

-- Summary
SELECT 'Migration complete' as status;
