-- ============================================
-- PHASE 1C: MEDIA, RELATIONS & AUDIT
-- Date: 2026-02-28
-- ============================================

-- ============================================
-- PRODUCT MEDIA
-- Images with explicit position ordering
-- ============================================

CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES product_variations(id) ON DELETE CASCADE,
    
    -- Media reference
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    
    -- Image details
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    
    -- For downloadable files
    file_type TEXT DEFAULT 'image',
    file_url TEXT,
    file_size INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LINKED PRODUCTS: UPSELLS
-- Products shown as better alternatives
-- ============================================

CREATE TABLE IF NOT EXISTS product_upsells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    upsell_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, upsell_product_id)
);

-- ============================================
-- LINKED PRODUCTS: CROSSSELLS
-- Products shown as complementary
-- ============================================

CREATE TABLE IF NOT EXISTS product_crosssells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    crosssell_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, crosssell_product_id)
);

-- ============================================
-- GROUPED PRODUCTS
-- For grouped product type
-- ============================================

CREATE TABLE IF NOT EXISTS grouped_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    child_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_product_id, child_product_id)
);

-- ============================================
-- EXTERNAL PRODUCTS
-- For affiliate/external product type
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Buy Now';

-- ============================================
-- PRODUCT STATUS HISTORY
-- Logs status transitions
-- ============================================

CREATE TABLE IF NOT EXISTS product_status_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES product_variations(id) ON DELETE CASCADE,
    
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT AUDIT LOG
-- Generic audit trail for all product-related tables
-- ============================================

CREATE TABLE IF NOT EXISTS product_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON product_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_media TO authenticated;

GRANT SELECT ON product_upsells TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_upsells TO authenticated;

GRANT SELECT ON product_crosssells TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_crosssells TO authenticated;

GRANT SELECT ON grouped_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON grouped_products TO authenticated;

GRANT SELECT ON product_status_log TO anon, authenticated;
GRANT INSERT ON product_status_log TO authenticated;

GRANT SELECT ON product_audit_log TO anon, authenticated;
GRANT INSERT ON product_audit_log TO authenticated;

-- ============================================
-- COMPLETE
-- ============================================
