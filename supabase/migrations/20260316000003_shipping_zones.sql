-- Migration: Shipping zones and rates
-- Date: 2026-03-16

CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    counties TEXT[] NOT NULL DEFAULT '{}',
    carrier TEXT,
    estimated_days TEXT DEFAULT '2-4d',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Standard',
    rate_amount BIGINT NOT NULL, -- KES
    min_order_amount BIGINT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Kenya shipping zones
INSERT INTO public.shipping_zones (name, counties, carrier, estimated_days) VALUES
    ('Nairobi CBD', ARRAY['Nairobi'], 'Sendy Express', '<4h'),
    ('Nairobi Suburbs', ARRAY['Kiambu'], 'Sendy Standard', 'Same Day'),
    ('Central Kenya', ARRAY['Murang''a', 'Kirinyaga', 'Nyeri', 'Nyandarua', 'Laikipia'], 'Wells Fargo Couriers', '1-2d'),
    ('Coast', ARRAY['Mombasa', 'Kilifi', 'Kwale', 'Taita Taveta', 'Tana River', 'Lamu'], 'G4S Courier', '2-4d'),
    ('Rift Valley', ARRAY['Nakuru', 'Uasin Gishu', 'Kericho', 'Bomet', 'Nandi', 'Trans Nzoia', 'Baringo', 'Elgeyo Marakwet', 'Kajiado', 'Narok', 'Samburu', 'West Pokot'], 'Wells Fargo Couriers', '2-3d'),
    ('Western Kenya', ARRAY['Kakamega', 'Bungoma', 'Busia', 'Vihiga'], 'Wells Fargo Couriers', '2-3d'),
    ('Nyanza', ARRAY['Kisumu', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'], 'Wells Fargo Couriers', '2-3d'),
    ('Eastern Kenya', ARRAY['Machakos', 'Makueni', 'Kitui', 'Embu', 'Meru', 'Tharaka Nithi'], 'Wells Fargo Couriers', '2-4d'),
    ('North Eastern', ARRAY['Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Turkana'], 'DHL Express', '3-5d')
ON CONFLICT DO NOTHING;

-- Seed rates for each zone
INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 200 FROM public.shipping_zones WHERE name = 'Nairobi CBD' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 350 FROM public.shipping_zones WHERE name = 'Nairobi Suburbs' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 500 FROM public.shipping_zones WHERE name = 'Central Kenya' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 800 FROM public.shipping_zones WHERE name = 'Coast' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 700 FROM public.shipping_zones WHERE name = 'Rift Valley' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 750 FROM public.shipping_zones WHERE name = 'Western Kenya' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 750 FROM public.shipping_zones WHERE name = 'Nyanza' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 800 FROM public.shipping_zones WHERE name = 'Eastern Kenya' ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, name, rate_amount)
SELECT id, 'Standard', 1500 FROM public.shipping_zones WHERE name = 'North Eastern' ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shipping zones" ON public.shipping_zones FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read shipping rates" ON public.shipping_rates FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage zones" ON public.shipping_zones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage rates" ON public.shipping_rates FOR ALL USING (auth.role() = 'authenticated');
