-- ============================================
-- PHASE 1A: CORE PRODUCTS SCHEMA (ADDITIVE)
-- WooCommerce-style product entry system
-- Date: 2026-02-28
-- Note: This migration adds columns to existing products table
-- ============================================

-- Add missing columns to existing products table
-- Status column (different from is_active)
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'pending'));
-- SKU column
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
-- Additional missing columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS regular_price INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS length DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(10,3);
-- Type column
ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'catalog' CHECK (visibility IN ('catalog', 'search', 'hidden', 'featured'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_start TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_end TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manage_stock BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'instock' CHECK (stock_status IN ('instock', 'outofstock', 'onbackorder'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorders TEXT DEFAULT 'no' CHECK (allow_backorders IN ('no', 'notify', 'yes'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_individually BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_class_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_status TEXT DEFAULT 'taxable' CHECK (tax_status IN ('taxable', 'none', 'shipping'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_class_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Buy Now';
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create new tables (these don't exist yet)

-- ============================================
-- PRODUCT TAGS (flat taxonomy)
-- ============================================

CREATE TABLE IF NOT EXISTS product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT-CATEGORY RELATIONSHIP
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (product_id, category_id)
);

-- ============================================
-- PRODUCT-TAG RELATIONSHIP
-- ============================================

CREATE TABLE IF NOT EXISTS product_tag_links (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- ============================================
-- ATTRIBUTE GROUPS (global/reusable attributes)
-- ============================================

CREATE TABLE IF NOT EXISTS product_attribute_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'select' 
        CHECK (type IN ('select', 'multiselect', 'text', 'color', 'boolean')),
    display_type TEXT DEFAULT 'dropdown' 
        CHECK (display_type IN ('dropdown', 'radio', 'checkbox', 'text')),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTRIBUTE TERMS (values for global attributes)
-- ============================================

CREATE TABLE IF NOT EXISTS product_attribute_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES product_attribute_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    value TEXT, -- hex code for color type
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, slug)
);

-- ============================================
-- PRODUCT ATTRIBUTES (global or local)
-- ============================================

CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Source: global (group_id + term_id) OR local (local_name + local_value)
    group_id UUID REFERENCES product_attribute_groups(id) ON DELETE CASCADE,
    term_id UUID REFERENCES product_attribute_terms(id),
    
    -- Local attribute fallback
    is_global BOOLEAN DEFAULT TRUE,
    local_name TEXT,
    local_value TEXT,
    local_options TEXT[],
    
    -- Configuration
    is_visible BOOLEAN DEFAULT TRUE,
    is_variation BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    
    -- Selected term for variations (populated when attribute is used on a variation)
    selected_term_id UUID REFERENCES product_attribute_terms(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD EXISTING CUSTOM FIELDS TO CATEGORIES
-- ============================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'products' 
    CHECK (display_mode IN ('products', 'subcategories', 'both'));
ALTER TABLE categories ADD COLUMN IF NOT EXISTS filterable BOOLEAN DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ============================================
-- GRANT PERMISSIONS (minimal for now, 1D will add RLS)
-- ============================================

GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

GRANT SELECT ON product_tag_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_tag_links TO authenticated;

GRANT SELECT ON product_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_categories TO authenticated;

GRANT SELECT ON product_attribute_groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_attribute_groups TO authenticated;

GRANT SELECT ON product_attribute_terms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_attribute_terms TO authenticated;

GRANT SELECT ON product_attributes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_attributes TO authenticated;

-- ============================================
-- COMPLETE
-- ============================================
