-- Seed Catalog for Testing Pricelist Import
-- Date: 2026-02-19

-- 1. Create a Category
INSERT INTO public.categories (name, slug) VALUES ('Smartphones', 'smartphones') ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Products
INSERT INTO public.products (id, name, slug, category_id) VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'iPhone 16 Pro Max', 'iphone-16-pro-max', (SELECT id FROM categories WHERE slug='smartphones')),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', (SELECT id FROM categories WHERE slug='smartphones'))
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Mesh Nodes
INSERT INTO public.product_mesh_node (product_id, brand, model_family) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'APPLE', 'IPHONE 16 PRO MAX'),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'SAMSUNG', 'S24 ULTRA')
ON CONFLICT (product_id) DO NOTHING;

-- 4. Seed Variants
INSERT INTO public.product_variants (id, product_id, name, sku, price_kes) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '256GB', 'IP16PM-256', 19000000),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', '256GB', 'S24U-256', 13000000)
ON CONFLICT (sku) DO NOTHING;
