-- Admin Dashboard Migration - Orders & Order Items
-- Date: 2026-02-20

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal BIGINT NOT NULL,
    vat_amount BIGINT DEFAULT 0,
    total_amount BIGINT NOT NULL,
    vat_applied BOOLEAN DEFAULT FALSE,
    shipping_address JSONB DEFAULT '{}',
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Admin policies
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update variants" ON public.product_variants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
