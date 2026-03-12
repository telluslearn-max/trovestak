-- Generate specs from product data
-- This creates detailed specs based on product names and categories

-- Function to extract storage from product name
CREATE OR REPLACE FUNCTION public.extract_storage_spec(product_name TEXT)
RETURNS JSONB AS $$
DECLARE
    storage TEXT;
BEGIN
    -- Extract storage from name (e.g., "256GB", "512 GB", "1TB")
    storage := (
        SELECT REGEXP_MATCH(product_name, '([0-9]+ ?(GB|TB))')[0]
    );
    
    IF storage IS NOT NULL THEN
        RETURN jsonb_build_object('Storage', storage);
    END IF;
    
    RETURN '{}'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Mobile Phones specs
UPDATE public.product_specs ps
SET spec_data = spec_data || public.extract_storage_spec(p.name) || 
    jsonb_build_object(
        'Display', '6.1" - 6.9" AMOLED',
        'Processor', CASE 
            WHEN p.name ILIKE '%17%' OR p.name ILIKE '%16%' THEN 'A18/A19 Bionic'
            WHEN p.name ILIKE '%15%' THEN 'A16 Bionic'
            WHEN p.name ILIKE '%14%' THEN 'A15 Bionic'
            WHEN p.name ILIKE '%13%' THEN 'A15 Bionic'
            ELSE 'A-series Bionic'
        END,
        'Camera', '12MP - 48MP Main',
        'Battery', '3000mAh - 5000mAh',
        'OS', CASE 
            WHEN p.name ILIKE '%iphone%' THEN 'iOS'
            ELSE 'Android'
        END,
        'Connectivity', '5G, 4G LTE, WiFi, Bluetooth'
    )
FROM public.products p
WHERE ps.product_id = p.id 
AND p.nav_category = 'mobile'
AND ps.spec_data = '{}'::JSONB;

-- Computing specs
UPDATE public.product_specs ps
SET spec_data = spec_data || 
    jsonb_build_object(
        'Processor', CASE
            WHEN p.name ILIKE '%i7%' THEN 'Intel Core i7'
            WHEN p.name ILIKE '%i5%' THEN 'Intel Core i5'
            WHEN p.name ILIKE '%i9%' THEN 'Intel Core i9'
            WHEN p.name ILIKE '%m3%' OR p.name ILIKE '%m4%' THEN 'Apple M3/M4'
            WHEN p.name ILIKE '%ryzen%' OR p.name ILIKE '%r5%' THEN 'AMD Ryzen 5'
            ELSE 'Intel/AMD Processor'
        END,
        'RAM', '8GB - 16GB',
        'Storage', '256GB - 1TB SSD',
        'Display', '13" - 16" FHD/4K',
        'Battery', '50Wh - 100Wh'
    )
FROM public.products p
WHERE ps.product_id = p.id 
AND p.nav_category = 'computing'
AND ps.spec_data = '{}'::JSONB;

-- Audio specs
UPDATE public.product_specs ps
SET spec_data = spec_data || 
    jsonb_build_object(
        'Type', CASE
            WHEN p.name ILIKE '%earbud%' THEN 'Wireless Earbuds'
            WHEN p.name ILIKE '%headphone%' THEN 'Over-Ear Headphones'
            WHEN p.name ILIKE '%speaker%' THEN 'Bluetooth Speaker'
            ELSE 'Audio Device'
        END,
        'Connectivity', 'Bluetooth 5.0+',
        'Battery', '6h - 30h Playtime',
        'Noise Cancellation', 'Active (ANC)' 
    )
FROM public.products p
WHERE ps.product_id = p.id 
AND p.nav_category = 'audio'
AND ps.spec_data = '{}'::JSONB;

-- Wearables specs
UPDATE public.product_specs ps
SET spec_data = spec_data || 
    jsonb_build_object(
        'Display', '1.2" - 2.0" AMOLED/OLED',
        'Battery', '18h - 36h',
        'Water Resistance', '5ATM - 10ATM',
        'Sensors', 'Heart Rate, SpO2, GPS',
        'OS', CASE
            WHEN p.name ILIKE '%apple%watch%' THEN 'watchOS'
            WHEN p.name ILIKE '%galaxy%watch%' THEN 'Wear OS'
            ELSE 'Proprietary'
        END
    )
FROM public.products p
WHERE ps.product_id = p.id 
AND p.nav_category = 'wearables'
AND ps.spec_data = '{}'::JSONB;

-- Cameras specs
UPDATE public.product_specs ps
SET spec_data = spec_data || 
    jsonb_build_object(
        'Type', CASE
            WHEN p.name ILIKE '%drone%' OR p.name ILIKE '%neo%' OR p.name ILIKE '%mini%' THEN 'Drone'
            WHEN p.name ILIKE '%gimbal%' OR p.name ILIKE '%osmo%' THEN 'Gimbal/Stabilizer'
            WHEN p.name ILIKE '%microphone%' OR p.name ILIKE '%mic%' THEN 'Microphone'
            WHEN p.name ILIKE '%camera%' OR p.name ILIKE '%hero%' THEN 'Action Camera'
            ELSE 'Camera Accessory'
        END,
        'Resolution', '4K - 8K Video',
        'Battery', '1h - 3h Runtime'
    )
FROM public.products p
WHERE ps.product_id = p.id 
AND p.nav_category = 'cameras'
AND ps.spec_data = '{}'::JSONB;

-- Smart Home specs
UPDATE public.product_specs ps
SET spec_data = spec_data || 
    jsonb_build_object(
        'Type', CASE
            WHEN p.name ILIKE '%tv%' THEN 'Smart TV'
            WHEN p.name ILIKE '%light%' THEN 'Smart Light'
            WHEN p.name ILIKE '%speaker%' THEN 'Smart Speaker'
            ELSE 'Smart Home Device'
        END,
        'Connectivity', 'WiFi, Bluetooth',
        'Power', 'AC 220V'
    )
FROM public.products p
WHERE ps.product_id = p.id 
AND p.nav_category = 'smart-home'
AND ps.spec_data = '{}'::JSONB;

SELECT 'Specs generated successfully' as status;
