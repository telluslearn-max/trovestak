-- ============================================
-- PHASE 1D: INDEXES, RLS POLICIES & TRIGGERS
-- Date: 2026-02-28
-- ============================================

-- ============================================
-- INDEXES: PRODUCTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_brand_type ON products(brand_type);
CREATE INDEX IF NOT EXISTS idx_products_is_virtual ON products(is_virtual);
CREATE INDEX IF NOT EXISTS idx_products_is_downloadable ON products(is_downloadable);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- INDEXES: VARIATIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_variations_sku ON product_variations(sku);
CREATE INDEX IF NOT EXISTS idx_variations_stock_status ON product_variations(stock_status);
CREATE INDEX IF NOT EXISTS idx_variations_deleted_at ON product_variations(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- INDEXES: ATTRIBUTES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attributes_product_id ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_attributes_group_id ON product_attribute_groups(id);
CREATE INDEX IF NOT EXISTS idx_attributes_terms_group ON product_attribute_terms(group_id);
CREATE INDEX IF NOT EXISTS idx_variation_attributes_variation ON variation_attributes(variation_id);

-- ============================================
-- INDEXES: CATEGORIES & TAGS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tag_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tag_links(tag_id);

-- ============================================
-- INDEXES: MEDIA
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_variation ON product_media(variation_id);
CREATE INDEX IF NOT EXISTS idx_product_media_position ON product_media(position);

-- ============================================
-- INDEXES: LINKED PRODUCTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_upsells_product ON product_upsells(product_id);
CREATE INDEX IF NOT EXISTS idx_crosssells_product ON product_crosssells(product_id);
CREATE INDEX IF NOT EXISTS idx_grouped_product ON grouped_products(group_product_id);

-- ============================================
-- INDEXES: AUDIT
-- ============================================

CREATE INDEX IF NOT EXISTS idx_status_log_product ON product_status_log(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON product_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON product_audit_log(changed_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_crosssells ENABLE ROW LEVEL SECURITY;
ALTER TABLE grouped_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_classes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: PRODUCTS
-- ============================================

-- Public: read published products
CREATE POLICY "Public can view published products" ON products
    FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Staff: read all non-archived (allow any authenticated user for admin access)
CREATE POLICY "Staff can view all products" ON products
    FOR SELECT USING (
        status != 'archived' 
        AND deleted_at IS NULL 
        AND auth.role() = 'authenticated'
    );

-- Editors: create products (allow any authenticated user)
CREATE POLICY "Editors can create products" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Editors: update products (allow any authenticated user)
CREATE POLICY "Editors can update products" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Managers: archive products (soft delete) (allow any authenticated user)
CREATE POLICY "Managers can archive products" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- RLS POLICATIONS: VARIATIONS
-- ============================================

-- Public: read variations of published products
CREATE POLICY "Public can view variations" ON product_variations
    FOR SELECT USING (
        deleted_at IS NULL 
        AND EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variations.product_id 
            AND p.status = 'published'
        )
    );

-- Staff: full access
CREATE POLICY "Staff can manage variations" ON product_variations
    FOR ALL USING (
        public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin')
    );

-- ============================================
-- RLS POLICIES: ATTRIBUTES
-- ============================================

CREATE POLICY "Anyone can view attributes" ON product_attribute_groups FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage attribute groups" ON product_attribute_groups
    FOR ALL USING (public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Anyone can view attribute terms" ON product_attribute_terms FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage attribute terms" ON product_attribute_terms
    FOR ALL USING (public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Anyone can view product attributes" ON product_attributes FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage product attributes" ON product_attributes
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- RLS POLICIES: CATEGORIES & TAGS
-- ============================================

CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Editors can manage categories" ON categories
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Public can view tags" ON product_tags FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage tags" ON product_tags
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Anyone can view product_categories" ON product_categories FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage product_categories" ON product_categories
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- RLS POLICIES: PRICING
-- ============================================

CREATE POLICY "Public can view prices" ON product_prices FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage prices" ON product_prices
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Public can view shipping classes" ON shipping_classes FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage shipping classes" ON shipping_classes
    FOR ALL USING (public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Public can view tax classes" ON tax_classes FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage tax classes" ON tax_classes
    FOR ALL USING (public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- RLS POLICIES: MEDIA
-- ============================================

CREATE POLICY "Public can view media" ON product_media FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage media" ON product_media
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- RLS POLICIES: LINKED PRODUCTS
-- ============================================

CREATE POLICY "Public can view upsells" ON product_upsells FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage upsells" ON product_upsells
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Public can view crosssells" ON product_crosssells FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage crosssells" ON product_crosssells
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Public can view grouped products" ON grouped_products FOR SELECT USING (TRUE);
CREATE POLICY "Editors can manage grouped products" ON grouped_products
    FOR ALL USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- RLS POLICIES: AUDIT
-- ============================================

CREATE POLICY "Staff can view status log" ON product_status_log FOR SELECT
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

CREATE POLICY "Staff can view audit log" ON product_audit_log FOR SELECT
    USING (public.has_role('manager') OR public.has_role('super_admin'));

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- 1. Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Sync product price range (min/max) from variations
CREATE OR REPLACE FUNCTION sync_product_price_range()
RETURNS TRIGGER AS $$
DECLARE
    prod_id UUID;
    min_p INTEGER;
    max_p INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'products' THEN
        prod_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'product_variations' THEN
        prod_id := NEW.product_id;
    ELSE
        RETURN NEW;
    END IF;
    
    -- Get the product type
    IF (SELECT type FROM products WHERE id = prod_id) = 'variable' THEN
        SELECT 
            MIN(COALESCE(v.sale_price, v.regular_price)),
            MAX(COALESCE(v.sale_price, v.regular_price))
        INTO min_p, max_p
        FROM product_variations v
        WHERE v.product_id = prod_id AND v.deleted_at IS NULL;
    ELSE
        min_p := COALESCE(NEW.sale_price, NEW.regular_price);
        max_p := min_p;
    END IF;
    
    UPDATE products SET
        min_price = min_p,
        max_price = max_p,
        updated_at = NOW()
    WHERE id = prod_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Auto-sync stock status
CREATE OR REPLACE FUNCTION sync_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manage_stock = FALSE OR NEW.manage_stock IS NULL THEN
        NEW.stock_status := 'instock';
    ELSIF NEW.stock_quantity IS NULL OR NEW.stock_quantity >= 0 THEN
        IF NEW.stock_quantity <= 0 THEN
            CASE NEW.allow_backorders
                WHEN 'yes' THEN NEW.stock_status := 'onbackorder';
                ELSE NEW.stock_status := 'outofstock';
            END CASE;
        ELSIF NEW.low_stock_threshold IS NOT NULL AND NEW.stock_quantity <= NEW.low_stock_threshold THEN
            NEW.stock_status := 'instock';
        ELSE
            NEW.stock_status := 'instock';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Log status changes
CREATE OR REPLACE FUNCTION log_product_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO product_status_log (product_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Generic audit log
CREATE OR REPLACE FUNCTION log_product_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO product_audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (
        TG_TABLE_NAME,
        NEW.id,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ATTACH TRIGGERS
-- ============================================

-- Products: updated_at, price sync, stock sync, status log, audit
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS products_price_sync ON products;
CREATE TRIGGER products_price_sync
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION sync_product_price_range();

DROP TRIGGER IF EXISTS products_stock_sync ON products;
CREATE TRIGGER products_stock_sync
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION sync_stock_status();

DROP TRIGGER IF EXISTS products_status_log ON products;
CREATE TRIGGER products_status_log
    AFTER UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION log_product_status_change();

DROP TRIGGER IF EXISTS products_audit_log ON products;
CREATE TRIGGER products_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_product_audit();

-- Product Variations: updated_at, price sync, stock sync, audit
DROP TRIGGER IF EXISTS variations_updated_at ON product_variations;
CREATE TRIGGER variations_updated_at
    BEFORE UPDATE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS variations_price_sync ON product_variations;
CREATE TRIGGER variations_price_sync
    AFTER INSERT OR UPDATE OR DELETE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION sync_product_price_range();

DROP TRIGGER IF EXISTS variations_stock_sync ON product_variations;
CREATE TRIGGER variations_stock_sync
    BEFORE INSERT OR UPDATE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION sync_stock_status();

DROP TRIGGER IF EXISTS variations_audit_log ON product_variations;
CREATE TRIGGER variations_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON product_variations
    FOR EACH ROW EXECUTE FUNCTION log_product_audit();

-- Product Attributes: audit
DROP TRIGGER IF EXISTS attributes_audit_log ON product_attributes;
CREATE TRIGGER attributes_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON product_attributes
    FOR EACH ROW EXECUTE FUNCTION log_product_audit();

-- Product Media: audit
DROP TRIGGER IF EXISTS media_audit_log ON product_media;
CREATE TRIGGER media_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON product_media
    FOR EACH ROW EXECUTE FUNCTION log_product_audit();

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION update_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_product_price_range() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_stock_status() TO authenticated;
GRANT EXECUTE ON FUNCTION log_product_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION log_product_audit() TO authenticated;

-- ============================================
-- COMPLETE
-- ============================================
