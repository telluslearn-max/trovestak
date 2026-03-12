-- ============================================
-- PHASE 1B: VARIATIONS & PRICING
-- Date: 2026-02-28
-- ============================================

-- ============================================
-- SHIPPING CLASSES
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TAX CLASSES
-- ============================================

CREATE TABLE IF NOT EXISTS tax_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    rate DECIMAL(5,4) DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign keys from products table (re-creating with actual references)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_shipping_class_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tax_class_fkey;

ALTER TABLE products 
    ADD CONSTRAINT products_shipping_class_fkey 
    FOREIGN KEY (shipping_class_id) REFERENCES shipping_classes(id) ON DELETE SET NULL;

ALTER TABLE products 
    ADD CONSTRAINT products_tax_class_fkey 
    FOREIGN KEY (tax_class_id) REFERENCES tax_classes(id) ON DELETE SET NULL;

-- ============================================
-- PRODUCT VARIATIONS
-- First-class variation records (not WooCommerce-style child posts)
-- ============================================

CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Variation Identity
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    description TEXT,
    
    -- Pricing (can differ from parent, nullable = inherit from parent)
    regular_price INTEGER,
    sale_price INTEGER,
    sale_price_start TIMESTAMPTZ,
    sale_price_end TIMESTAMPTZ,
    
    -- Inventory (individual stock for this variation)
    manage_stock BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER,
    stock_status TEXT DEFAULT 'instock' 
        CHECK (stock_status IN ('instock', 'outofstock', 'onbackorder')),
    allow_backorders TEXT DEFAULT 'no' 
        CHECK (allow_backorders IN ('no', 'notify', 'yes')),
    low_stock_threshold INTEGER,
    
    -- Dimensions (can differ from parent)
    weight DECIMAL(10,3),
    length DECIMAL(10,3),
    width DECIMAL(10,3),
    height DECIMAL(10,3),
    
    -- Virtual/Downloadable (can differ from parent)
    is_virtual BOOLEAN DEFAULT FALSE,
    is_downloadable BOOLEAN DEFAULT FALSE,
    
    -- Downloadable files
    download_files JSONB DEFAULT '[]',
    download_limit INTEGER DEFAULT -1,
    download_expiry INTEGER DEFAULT -1,
    
    -- Image reference (primary image for this variation)
    image_url TEXT,
    
    -- Timestamps & Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(product_id, sku)
);

-- ============================================
-- VARIATION ATTRIBUTES
-- Links each variation to its attribute values
-- ============================================

CREATE TABLE IF NOT EXISTS variation_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    
    -- For global attributes: reference to term
    term_id UUID REFERENCES product_attribute_terms(id),
    
    -- For local attributes: explicit value
    value TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(variation_id, attribute_id)
);

-- ============================================
-- PRODUCT PRICES (multi-currency)
-- Native multi-currency support
-- ============================================

CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES product_variations(id) ON DELETE CASCADE,
    
    currency_code TEXT NOT NULL DEFAULT 'KES',
    regular_price INTEGER NOT NULL DEFAULT 0,
    sale_price INTEGER,
    sale_price_start TIMESTAMPTZ,
    sale_price_end TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, variation_id, currency_code)
);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON shipping_classes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON shipping_classes TO authenticated;

GRANT SELECT ON tax_classes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tax_classes TO authenticated;

GRANT SELECT ON product_variations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_variations TO authenticated;

GRANT SELECT ON variation_attributes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON variation_attributes TO authenticated;

GRANT SELECT ON product_prices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_prices TO authenticated;

-- ============================================
-- COMPLETE
-- ============================================
