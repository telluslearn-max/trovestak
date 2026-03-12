-- RLS Fix and Re-seeding for Suppliers
-- Date: 2026-02-19 22:45

-- 1. Fix RLS
DROP POLICY IF EXISTS "Auth users can view suppliers" ON public.supplier;
DROP POLICY IF EXISTS "Auth users can view offers" ON public.supplier_product_offer;
DROP POLICY IF EXISTS "Public can view suppliers" ON public.supplier;
DROP POLICY IF EXISTS "Public can view offers" ON public.supplier_product_offer;

CREATE POLICY "Public can view suppliers" ON public.supplier FOR SELECT USING (true);
CREATE POLICY "Public can view offers" ON public.supplier_product_offer FOR SELECT USING (true);

-- 2. Ensure Seed Data
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
('wadaani',       'Wadaani',             'wadaani',       NULL,         'individual',   'whatsapp_text', 'Suppliers/wadaani',        '2026-02-18')
ON CONFLICT (name) DO UPDATE SET last_pricelist_date = EXCLUDED.last_pricelist_date;
