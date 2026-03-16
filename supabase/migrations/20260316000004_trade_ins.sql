-- Migration: Trade-in intake table
-- Date: 2026-03-16

CREATE TABLE IF NOT EXISTS public.trade_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id),
    customer_name TEXT,
    customer_phone TEXT,
    device_name TEXT NOT NULL,
    device_brand TEXT,
    device_model TEXT,
    condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('like_new', 'good', 'fair', 'poor')),
    quoted_value BIGINT, -- KES
    final_value BIGINT, -- KES (after inspection)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'inspecting', 'approved', 'rejected', 'completed')),
    notes TEXT,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trade_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_ins" ON public.trade_ins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own trade_ins" ON public.trade_ins FOR SELECT USING (auth.uid() = customer_id);
