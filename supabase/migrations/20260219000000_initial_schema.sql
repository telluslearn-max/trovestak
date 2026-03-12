-- Trovestak Master Schema Migration
-- Targets: Core Commerce, Relational Mesh Model, Suppliers, Finance, and HR
-- Date: 2026-02-19

-- ==========================================
-- 1. CORE COMMERCE TABLES
-- ==========================================

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price_kes BIGINT NOT NULL, -- Stored in cents
    stock_quantity INTEGER DEFAULT 0,
    options JSONB DEFAULT '{}', -- e.g. {"color": "Blue", "storage": "256GB"}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. RELATIONAL MESH MODEL
-- ==========================================

-- Product Mesh Node
CREATE TABLE public.product_mesh_node (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    compute_class TEXT NOT NULL DEFAULT 'mid' CHECK (compute_class IN ('low', 'mid', 'high')),
    requires_master BOOLEAN DEFAULT FALSE,
    is_master BOOLEAN DEFAULT FALSE,
    category_slug TEXT,
    brand TEXT,
    model_family TEXT,
    model_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Relationships (Directed Graph)
CREATE TABLE public.product_relation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    to_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('requires_tethering', 'compatible_with', 'accessory_of', 'replaces', 'bundles_with')),
    strength DECIMAL(3,2) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_product_id, to_product_id, relation_type)
);

-- User Owned Devices
CREATE TABLE public.user_device (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    serial_number TEXT,
    purchase_source TEXT DEFAULT 'trovestak',
    order_id UUID, -- Will link to orders table later
    acquired_at DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, serial_number)
);

-- ==========================================
-- 3. SUPPLIER MODULE
-- ==========================================

-- Suppliers
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Product Offers (The "Cheapest Supplier" Source)
CREATE TABLE public.supplier_product_offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    cost_price BIGINT NOT NULL, -- Stored in cents
    currency TEXT DEFAULT 'KES',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, variant_id)
);

-- ==========================================
-- 4. FINANCE & COMPLIANCE
-- ==========================================

-- KRA eTIMS Invoices
CREATE TABLE public.kra_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL, -- Link to orders
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date TIMESTAMPTZ NOT NULL,
    customer_name TEXT,
    subtotal BIGINT NOT NULL,
    vat_amount BIGINT DEFAULT 0,
    total_amount BIGINT NOT NULL,
    vat_applied BOOLEAN DEFAULT FALSE,
    etims_status TEXT DEFAULT 'pending',
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Records
CREATE TABLE public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    amount BIGINT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    description TEXT NOT NULL,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. RLS POLICIES (BASIC)
-- ==========================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can view active products/variants/categories
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_variants.product_id AND is_active = TRUE));
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = TRUE);

-- Users can manage their own devices
ALTER TABLE public.user_device ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own devices" ON public.user_device FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 6. RPC FUNCTIONS
-- ==========================================

-- Function to get cheapest supplier for a variant
CREATE OR REPLACE FUNCTION get_cheapest_supplier(p_variant_id UUID)
RETURNS TABLE (supplier_name TEXT, cost_price BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.name, spo.cost_price
    FROM public.supplier_product_offer spo
    JOIN public.suppliers s ON s.id = spo.supplier_id
    WHERE spo.variant_id = p_variant_id
    ORDER BY spo.cost_price ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
