-- Migration: Add rider assignment + dispatch tracking to orders, create riders table
-- Date: 2026-03-16

-- Extend orders with dispatch fields
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS rider_name TEXT,
    ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Riders table (delivery partners)
CREATE TABLE IF NOT EXISTS public.riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    zone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a few riders
INSERT INTO public.riders (name, phone, zone) VALUES
    ('James Mwangi', '+254711000001', 'Nairobi CBD'),
    ('Faith Wanjiku', '+254722000002', 'Westlands'),
    ('Brian Otieno', '+254733000003', 'Thika Road'),
    ('Grace Kamau', '+254744000004', 'Kiambu'),
    ('David Njoroge', '+254755000005', 'Mombasa Road')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage riders" ON public.riders FOR ALL USING (auth.role() = 'authenticated');
