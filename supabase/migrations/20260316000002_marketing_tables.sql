-- Migration: Add discount_codes and flash_sales tables
-- Date: 2026-03-16

-- Discount codes (used by checkout/actions.ts)
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    usage_limit INTEGER,
    minimum_order_amount BIGINT DEFAULT 0,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flash sales (time-limited discount events)
CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 99),
    product_ids UUID[] DEFAULT '{}',
    category_slugs TEXT[] DEFAULT '{}',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    banner_color TEXT DEFAULT '#ff3b30',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discount_codes" ON public.discount_codes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage flash_sales" ON public.flash_sales FOR ALL USING (auth.role() = 'authenticated');

-- Storefront can read active codes (for checkout validation)
CREATE POLICY "Anyone can read active discount codes" ON public.discount_codes FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Anyone can read active flash sales" ON public.flash_sales FOR SELECT USING (is_active = TRUE);
