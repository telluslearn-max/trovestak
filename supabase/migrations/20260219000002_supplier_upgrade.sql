-- Upgrade Supplier Module to V3 Specification
-- Adds reliability tracking, metadata-rich offers, and seeds initial suppliers

-- 1. CLEANUP (Drop old simple tables)
DROP TABLE IF EXISTS public.supplier_product_offer CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- 2. ENHANCED SUPPLIER TABLE
CREATE TABLE public.supplier (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identity
    name            VARCHAR(255) NOT NULL UNIQUE,
    display_name    VARCHAR(255),           -- "Ahmed Zack Electronics"
    slug            VARCHAR(100) UNIQUE,    -- "ahmed-zack"
    -- Contact
    phone_primary   VARCHAR(20),
    phone_secondary VARCHAR(20),
    whatsapp        VARCHAR(20),
    email           VARCHAR(255),
    location        VARCHAR(255),           -- "Nairobi CBD, Tom Mboya St"
    -- Business
    business_type   VARCHAR(30) DEFAULT 'individual'
                    CHECK (business_type IN ('individual', 'company', 'distributor', 'importer')),
    payment_terms   VARCHAR(100),           -- "Cash on delivery", "30 days net"
    currency        VARCHAR(3) DEFAULT 'KES',
    -- Performance metrics (computed)
    reliability_score DECIMAL(3,2) DEFAULT 0.0,  -- 0.0–1.0, computed from order history
    total_orders    INTEGER DEFAULT 0,
    total_spend_kes BIGINT DEFAULT 0,       -- KES cents
    avg_delivery_days DECIMAL(4,1),
    -- Catalog metadata
    last_pricelist_date DATE,
    pricelist_format VARCHAR(20),           -- 'whatsapp_text', 'excel', 'image', 'mixed'
    source_folder   VARCHAR(255),           -- 'Suppliers/ahmed zack'
    -- Status
    is_active       BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENHANCED PRODUCT OFFER TABLE
CREATE TABLE public.supplier_product_offer (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Core FK
    supplier_id     UUID NOT NULL REFERENCES public.supplier(id) ON DELETE CASCADE,
    variant_id      UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    -- Pricing (COST ONLY)
    cost_price_kes  BIGINT NOT NULL,        -- KES cents
    -- Stock
    stock_quantity  INTEGER DEFAULT 0,      -- 0 = out of stock
    -- Supplier-specific metadata
    supplier_sku    VARCHAR(100),           -- Supplier's own product code
    warranty_type   VARCHAR(50),            -- 'none', '1_year', '2_year_ea', 'ex_uk', 'refurbished'
    condition       VARCHAR(20) DEFAULT 'new'
                    CHECK (condition IN ('new', 'refurbished', 'used', 'ex_uk', 'non_active')),
    region_origin   VARCHAR(30),            -- 'east_africa', 'dubai', 'uk', 'usa', 'global'
    sim_type        VARCHAR(20),            -- 'sim', 'esim', 'dual_sim', 'sim_esim'
    battery_health  INTEGER,                -- % for used phones
    -- Import tracking
    import_batch_id UUID,                   -- Will link to import_batch table
    pricelist_date  DATE,                   -- Date of the pricelist this came from
    raw_line        TEXT,                   -- Original raw text line for audit
    -- Priority
    is_primary      BOOLEAN DEFAULT FALSE,  -- TRUE = preferred supplier for this variant
    -- Status
    is_available    BOOLEAN DEFAULT TRUE,
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    -- Unique: one offer per supplier per variant per condition per region
    UNIQUE(supplier_id, variant_id, condition, region_origin, sim_type)
);

-- 4. SEED INITIAL SUPPLIERS
INSERT INTO public.supplier (name, display_name, slug, phone_primary, business_type, pricelist_format, source_folder, last_pricelist_date) VALUES
('ahmed zack',    'Ahmed Zack',          'ahmed-zack',    NULL,         'individual',   'whatsapp_text', 'Suppliers/ahmed zack',    '2026-02-18'),
('al iman',       'Al Iman',             'al-iman',       NULL,         'individual',   'mixed',         'Suppliers/al iman',        '2026-02-18'),
('charity',       'Charity (Westcom)',    'charity',       NULL,         'company',      'whatsapp_text', 'Suppliers/charity',        '2026-02-18'),
('derrick shikoli','Derrick Shikoli',    'derrick-shikoli',NULL,        'individual',   'whatsapp_text', 'Suppliers/derrick shikoli','2025-10-14'),
('genspace',      'Genspace',            'genspace',      NULL,         'company',      'excel',         'Suppliers/genspace',       '2026-01-01'),
('gitau',         'Gitau Phones',        'gitau',         NULL,         'individual',   'whatsapp_text', 'Suppliers/gitau',          '2026-02-18'),
('kato',          'Kato',                'kato',          NULL,         'individual',   'image',         'Suppliers/kato',           '2026-02-18'),
('machoya',       'Machoya',             'machoya',       '0723415979', 'individual',   'whatsapp_text', 'Suppliers/machoya',        '2026-02-18'),
('rashid king',   'Rashid King',         'rashid-king',   NULL,         'individual',   'whatsapp_text', 'Suppliers/rashid king',    '2026-02-05'),
('wadaani',       'Wadaani',             'wadaani',       NULL,         'individual',   'whatsapp_text', 'Suppliers/wadaani',        '2026-02-18');

-- 5. UPDATED CHEAPEST SUPPLIER RPC
DROP FUNCTION IF EXISTS get_cheapest_supplier(UUID);
CREATE OR REPLACE FUNCTION get_cheapest_supplier(p_variant_id UUID)
RETURNS TABLE (
    supplier_id UUID,
    supplier_name TEXT, 
    cost_price BIGINT,
    warranty_type TEXT,
    condition TEXT,
    region_origin TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.display_name, 
        spo.cost_price_kes,
        spo.warranty_type::TEXT,
        spo.condition::TEXT,
        spo.region_origin::TEXT
    FROM public.supplier_product_offer spo
    JOIN public.supplier s ON s.id = spo.supplier_id
    WHERE spo.variant_id = p_variant_id
      AND spo.is_available = TRUE
    ORDER BY spo.cost_price_kes ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS FOR SUPPLIER TABLES
ALTER TABLE public.supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_product_offer ENABLE ROW LEVEL SECURITY;

-- Staff/Admin can manage suppliers, public can view for now
CREATE POLICY "Public can view suppliers" ON public.supplier FOR SELECT USING (true);
CREATE POLICY "Public can view offers" ON public.supplier_product_offer FOR SELECT USING (true);
