-- ============================================
-- TROVESTAK PRODUCT PAGE BACKEND
-- Complete Schema for E-Commerce
-- Date: 2026-02-24
-- ============================================

-- ============================================
-- 1. ENHANCE PRODUCTS TABLE
-- ============================================

-- Add product page fields to existing products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_subcategory TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_section TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '1 Year';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'in_stock' CHECK (availability IN ('in_stock', 'limited', 'preorder', 'out_of_stock'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- ============================================
-- 2. PRICING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    cost_price INTEGER NOT NULL DEFAULT 0,
    sell_price INTEGER NOT NULL DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    compare_price INTEGER,
    currency TEXT DEFAULT 'KES',
    price_history JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. VARIANTS TABLE (Colors, Sizes, Storage)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_variants_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL CHECK (variant_type IN ('color', 'size', 'storage', 'tier', 'connectivity')),
    variant_name TEXT NOT NULL,
    hex_primary TEXT,
    hex_secondary TEXT,
    price_delta INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TECHNICAL SPECS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    spec_category TEXT,
    spec_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CONTENT TABLE (Features, FAQ, Overview)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    overview TEXT,
    features JSONB DEFAULT '[]',
    faq JSONB DEFAULT '[]',
    gallery JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ADD-ONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    addon_type TEXT NOT NULL CHECK (addon_type IN ('bnpl', 'trade_in', 'shipping', 'insurance')),
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, addon_type)
);

-- ============================================
-- 7. MEGAMENU CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.megamenu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.megamenu_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    megamenu_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_nav_category ON public.products(nav_category);
CREATE INDEX IF NOT EXISTS idx_products_nav_subcategory ON public.products(nav_subcategory);
CREATE INDEX IF NOT EXISTS idx_products_brand_type ON public.products(brand_type);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(availability);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_pricing_product_id ON public.product_pricing(product_id);

-- Variants indexes
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants_detail(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_type ON public.product_variants_detail(variant_type);

-- Specs indexes
CREATE INDEX IF NOT EXISTS idx_specs_product_id ON public.product_specs(product_id);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_product_id ON public.product_content(product_id);

-- Add-ons indexes
CREATE INDEX IF NOT EXISTS idx_addons_product_id ON public.product_addons(product_id);

-- Megamenu indexes
CREATE INDEX IF NOT EXISTS idx_megamenu_parent ON public.megamenu_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_megamenu_sort ON public.megamenu_categories(sort_order);

-- ============================================
-- 9. PRICING FUNCTIONS
-- ============================================

-- Get current price with discount applied
CREATE OR REPLACE FUNCTION public.get_current_price(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_price INTEGER;
    discount INTEGER;
BEGIN
    SELECT sell_price, discount_percent INTO current_price, discount
    FROM public.product_pricing
    WHERE product_id = p_product_id;
    
    IF current_price IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN current_price - (current_price * discount / 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply discount to product
CREATE OR REPLACE FUNCTION public.apply_product_discount(p_product_id UUID, p_discount_percent INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.product_pricing
    SET discount_percent = p_discount_percent,
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set sell price
CREATE OR REPLACE FUNCTION public.set_product_sell_price(p_product_id UUID, p_sell_price INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.product_pricing (product_id, sell_price, created_at, updated_at)
    VALUES (p_product_id, p_sell_price, NOW(), NOW())
    ON CONFLICT (product_id) DO UPDATE
    SET sell_price = p_sell_price, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set cost price
CREATE OR REPLACE FUNCTION public.set_product_cost_price(p_product_id UUID, p_cost_price INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.product_pricing (product_id, cost_price, created_at, updated_at)
    VALUES (p_product_id, p_cost_price, NOW(), NOW())
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = p_cost_price, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. MEGAMENU SEED DATA
-- ============================================

INSERT INTO public.megamenu_categories (name, slug, sort_order, is_active) VALUES
('Mobile', 'mobile', 1, true),
('Computing', 'computing', 2, true),
('Audio', 'audio', 3, true),
('Wearables', 'wearables', 4, true),
('Gaming', 'gaming', 5, true),
('Cameras', 'cameras', 6, true),
('Smart Home', 'smart-home', 7, true),
('Software', 'software', 8, true)
ON CONFLICT (slug) DO NOTHING;

-- Mobile subcategories
INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Flagship Phones', 'flagship-phones', id, 1 FROM public.megamenu_categories WHERE slug = 'mobile'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Mid-Range Phones', 'mid-range-phones', id, 2 FROM public.megamenu_categories WHERE slug = 'mobile'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Budget Phones', 'budget-phones', id, 3 FROM public.megamenu_categories WHERE slug = 'mobile'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'iPad', 'ipad', id, 4 FROM public.megamenu_categories WHERE slug = 'mobile'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Android Tablets', 'android-tablets', id, 5 FROM public.megamenu_categories WHERE slug = 'mobile'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Charging', 'charging', id, 6 FROM public.megamenu_categories WHERE slug = 'mobile'
ON CONFLICT (slug) DO NOTHING;

-- Computing subcategories
INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'MacBooks', 'macbooks', id, 1 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Windows Laptops', 'windows-laptops', id, 2 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Monitors', 'monitors', id, 3 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Peripherals', 'peripherals', id, 4 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Networking', 'networking', id, 5 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Printers', 'printers', id, 6 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Storage', 'storage', id, 7 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Power & UPS', 'power-ups', id, 8 FROM public.megamenu_categories WHERE slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

-- Audio subcategories
INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Wireless Earbuds', 'wireless-earbuds', id, 1 FROM public.megamenu_categories WHERE slug = 'audio'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Over-Ear Headphones', 'over-ear-headphones', id, 2 FROM public.megamenu_categories WHERE slug = 'audio'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Home Audio', 'home-audio', id, 3 FROM public.megamenu_categories WHERE slug = 'audio'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Bluetooth Speakers', 'bluetooth-speakers', id, 4 FROM public.megamenu_categories WHERE slug = 'audio'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Soundbars', 'soundbars', id, 5 FROM public.megamenu_categories WHERE slug = 'audio'
ON CONFLICT (slug) DO NOTHING;

-- Wearables subcategories
INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Apple Watch', 'apple-watch', id, 1 FROM public.megamenu_categories WHERE slug = 'wearables'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Samsung Watch', 'samsung-watch', id, 2 FROM public.megamenu_categories WHERE slug = 'wearables'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Fitness Trackers', 'fitness-trackers', id, 3 FROM public.megamenu_categories WHERE slug = 'wearables'
ON CONFLICT (slug) DO NOTHING;

-- Gaming subcategories
INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'PlayStation', 'playstation', id, 1 FROM public.megamenu_categories WHERE slug = 'gaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Xbox', 'xbox', id, 2 FROM public.megamenu_categories WHERE slug = 'gaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Nintendo Switch', 'nintendo-switch', id, 3 FROM public.megamenu_categories WHERE slug = 'gaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Gaming Gear', 'gaming-gear', id, 4 FROM public.megamenu_categories WHERE slug = 'gaming'
ON CONFLICT (slug) DO NOTHING;

-- Smart Home subcategories
INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Smart TVs', 'smart-tvs', id, 1 FROM public.megamenu_categories WHERE slug = 'smart-home'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Home Appliances', 'home-appliances', id, 2 FROM public.megamenu_categories WHERE slug = 'smart-home'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.megamenu_categories (name, slug, parent_id, sort_order) 
SELECT 'Smart Lights', 'smart-lights', id, 3 FROM public.megamenu_categories WHERE slug = 'smart-home'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.megamenu_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view pricing" ON public.product_pricing FOR SELECT USING (TRUE);
CREATE POLICY "Public can view variants" ON public.product_variants_detail FOR SELECT USING (TRUE);
CREATE POLICY "Public can view specs" ON public.product_specs FOR SELECT USING (TRUE);
CREATE POLICY "Public can view content" ON public.product_content FOR SELECT USING (TRUE);
CREATE POLICY "Public can view addons" ON public.product_addons FOR SELECT USING (TRUE);
CREATE POLICY "Public can view megamenu" ON public.megamenu_categories FOR SELECT USING (is_active = TRUE);

-- Admin write access (using existing has_role function)
CREATE POLICY "Admins can manage pricing" ON public.product_pricing FOR ALL
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Admins can manage variants" ON public.product_variants_detail FOR ALL
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Admins can manage specs" ON public.product_specs FOR ALL
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Admins can manage content" ON public.product_content FOR ALL
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Admins can manage addons" ON public.product_addons FOR ALL
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Admins can manage megamenu" ON public.megamenu_categories FOR ALL
    USING (public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.product_pricing TO anon, authenticated;
GRANT ALL ON public.product_pricing TO authenticated;

GRANT SELECT ON public.product_variants_detail TO anon, authenticated;
GRANT ALL ON public.product_variants_detail TO authenticated;

GRANT SELECT ON public.product_specs TO anon, authenticated;
GRANT ALL ON public.product_specs TO authenticated;

GRANT SELECT ON public.product_content TO anon, authenticated;
GRANT ALL ON public.product_content TO authenticated;

GRANT SELECT ON public.product_addons TO anon, authenticated;
GRANT ALL ON public.product_addons TO authenticated;

GRANT SELECT ON public.megamenu_categories TO anon, authenticated;
GRANT ALL ON public.megamenu_categories TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_price(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_product_discount(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_product_sell_price(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_product_cost_price(UUID, INTEGER) TO authenticated;

-- ============================================
-- COMPLETE
-- ============================================
