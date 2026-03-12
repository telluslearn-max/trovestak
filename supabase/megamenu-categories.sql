-- ============================================
-- MEGAMENU CATEGORY STRUCTURE
-- Based on your specification
-- ============================================

-- First, clear existing categories (optional - only if starting fresh)
-- DELETE FROM categories;

-- ============================================
-- LEVEL 1: MAIN CATEGORIES (7)
-- ============================================

INSERT INTO categories (name, slug, description, is_active, position, display_mode, column_layout) VALUES
('Mobile', 'mobile', 'Mobile phones, tablets and accessories', true, 1, 'both', '3-column'),
('Computing', 'computing', 'Laptops, desktops, monitors and accessories', true, 2, 'both', '3-column'),
('Audio', 'audio', 'Headphones, speakers and professional audio', true, 3, 'both', '3-column'),
('Gaming', 'gaming', 'Consoles, PC gaming and accessories', true, 4, 'both', '3-column'),
('Cameras', 'cameras', 'Cameras, drones and accessories', true, 5, 'both', '3-column'),
('Wearables', 'wearables', 'Smartwatches, fitness trackers and smart glasses', true, 6, 'both', '3-column'),
('Smart Home', 'smart-home', 'Smart TVs, connectivity and streaming devices', true, 7, 'both', '3-column')
ON CONFLICT (slug) DO NOTHING;

-- Get Level 1 IDs
-- Mobile = 1, Computing = 2, Audio = 3, Gaming = 4, Cameras = 5, Wearables = 6, Smart Home = 7

-- ============================================
-- LEVEL 2: SUBCATEGORIES (21)
-- ============================================

-- Mobile (parent_id = 1)
INSERT INTO categories (name, slug, description, parent_id, is_active, position, display_mode) VALUES
('Mobile Phones', 'mobile-phones', 'All mobile phones', (SELECT id FROM categories WHERE slug = 'mobile' LIMIT 1), true, 1, 'both'),
('Tablets', 'tablets', 'iPads and Android tablets', (SELECT id FROM categories WHERE slug = 'mobile' LIMIT 1), true, 2, 'both'),
('Mobile Accessories', 'mobile-accessories', 'Cases, chargers and more', (SELECT id FROM categories WHERE slug = 'mobile' LIMIT 1), true, 3, 'both'),

-- Computing (parent_id = 2)
('Laptops', 'laptops', 'MacBooks, Windows and Chromebooks', (SELECT id FROM categories WHERE slug = 'computing' LIMIT 1), true, 1, 'both'),
('Desktops & Monitors', 'desktops-monitors', 'iMacs and gaming monitors', (SELECT id FROM categories WHERE slug = 'computing' LIMIT 1), true, 2, 'both'),
('Computing Accessories', 'computing-accessories', 'Power, UPS and peripherals', (SELECT id FROM categories WHERE slug = 'computing' LIMIT 1), true, 3, 'both'),

-- Audio (parent_id = 3)
('Headphones', 'headphones', 'Over-ear and wireless', (SELECT id FROM categories WHERE slug = 'audio' LIMIT 1), true, 1, 'both'),
('Speakers', 'speakers', 'Bluetooth and home audio', (SELECT id FROM categories WHERE slug = 'audio' LIMIT 1), true, 2, 'both'),
('Professional Audio', 'professional-audio', 'Studio and business audio', (SELECT id FROM categories WHERE slug = 'audio' LIMIT 1), true, 3, 'both'),

-- Gaming (parent_id = 4)
('Consoles', 'consoles', 'PS5, Xbox and Nintendo', (SELECT id FROM categories WHERE slug = 'gaming' LIMIT 1), true, 1, 'both'),
('PC Gaming', 'pc-gaming', 'Gaming laptops and PCs', (SELECT id FROM categories WHERE slug = 'gaming' LIMIT 1), true, 2, 'both'),
('Gaming Accessories', 'gaming-accessories', 'Controllers and gear', (SELECT id FROM categories WHERE slug = 'gaming' LIMIT 1), true, 3, 'both'),

-- Cameras (parent_id = 5)
('Cameras', 'cameras', 'DSLR and mirrorless', (SELECT id FROM categories WHERE slug = 'cameras' LIMIT 1), true, 1, 'both'),
('Drones & Gimbals', 'drones-gimbals', 'DJI drones and gimbals', (SELECT id FROM categories WHERE slug = 'cameras' LIMIT 1), true, 2, 'both'),
('Camera Accessories', 'camera-accessories', 'Lenses and bags', (SELECT id FROM categories WHERE slug = 'cameras' LIMIT 1), true, 3, 'both'),

-- Wearables (parent_id = 6)
('Smartwatches', 'smartwatches', 'Apple Watch and Galaxy Watch', (SELECT id FROM categories WHERE slug = 'wearables' LIMIT 1), true, 1, 'both'),
('Fitness & Audio', 'fitness-audio', 'Fitness trackers and earbuds', (SELECT id FROM categories WHERE slug = 'wearables' LIMIT 1), true, 2, 'both'),
('Smart Glasses', 'smart-glasses', 'Audio glasses and AR', (SELECT id FROM categories WHERE slug = 'wearables' LIMIT 1), true, 3, 'both'),

-- Smart Home (parent_id = 7)
('Smart TVs', 'smart-tvs', 'Samsung, LG and more', (SELECT id FROM categories WHERE slug = 'smart-home' LIMIT 1), true, 1, 'both'),
('Connectivity', 'connectivity', 'Starlink and routers', (SELECT id FROM categories WHERE slug = 'smart-home' LIMIT 1), true, 2, 'both'),
('Streaming & Smart', 'streaming-smart', 'Apple TV and smart lights', (SELECT id FROM categories WHERE slug = 'smart-home' LIMIT 1), true, 3, 'both')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- LEVEL 3: SUB-SUBCATEGORIES (~60+)
-- ============================================

-- Mobile Phones subcategories
INSERT INTO categories (name, slug, description, parent_id, is_active, position) VALUES
('Flagship Phones', 'flagship-phones', 'Premium smartphones', (SELECT id FROM categories WHERE slug = 'mobile-phones' LIMIT 1), true, 1),
('Mid-Range Phones', 'mid-range-phones', 'Mid-tier smartphones', (SELECT id FROM categories WHERE slug = 'mobile-phones' LIMIT 1), true, 2),
('Budget Phones', 'budget-phones', 'Affordable smartphones', (SELECT id FROM categories WHERE slug = 'mobile-phones' LIMIT 1), true, 3),

-- Tablets subcategories
('iPad', 'ipad', 'Apple iPads', (SELECT id FROM categories WHERE slug = 'tablets' LIMIT 1), true, 1),
('Android Tablets', 'android-tablets', 'Samsung and other Android tablets', (SELECT id FROM categories WHERE slug = 'tablets' LIMIT 1), true, 2),

-- Mobile Accessories subcategories
('Charging', 'mobile-charging', 'Chargers and cables', (SELECT id FROM categories WHERE slug = 'mobile-accessories' LIMIT 1), true, 1),
('Cases & Protection', 'cases-protection', 'Cases and screen protectors', (SELECT id FROM categories WHERE slug = 'mobile-accessories' LIMIT 1), true, 2),

-- Laptops subcategories
('MacBooks', 'macbooks', 'Apple MacBooks', (SELECT id FROM categories WHERE slug = 'laptops' LIMIT 1), true, 1),
('Windows Laptops', 'windows-laptops', 'Windows laptops', (SELECT id FROM categories WHERE slug = 'laptops' LIMIT 1), true, 2),
('Chromebooks', 'chromebooks', 'Chrome OS laptops', (SELECT id FROM categories WHERE slug = 'laptops' LIMIT 1), true, 3),

-- Desktops & Monitors subcategories
('iMac', 'imac', 'Apple iMac', (SELECT id FROM categories WHERE slug = 'desktops-monitors' LIMIT 1), true, 1),
('Gaming Monitors', 'gaming-monitors', 'High refresh rate monitors', (SELECT id FROM categories WHERE slug = 'desktops-monitors' LIMIT 1), true, 2),
('4K Ultrawide', '4k-ultrawide', '4K and ultrawide monitors', (SELECT id FROM categories WHERE slug = 'desktops-monitors' LIMIT 1), true, 3),

-- Computing Accessories subcategories
('Power & UPS', 'power-ups', 'Power supplies and UPS', (SELECT id FROM categories WHERE slug = 'computing-accessories' LIMIT 1), true, 1),
('Peripherals', 'computing-peripherals', 'Keyboards, mice and more', (SELECT id FROM categories WHERE slug = 'computing-accessories' LIMIT 1), true, 2),

-- Headphones subcategories
('Over-Ear', 'over-ear-headphones', 'Over-ear headphones', (SELECT id FROM categories WHERE slug = 'headphones' LIMIT 1), true, 1),
('Wireless Earbuds', 'wireless-earbuds', 'True wireless earbuds', (SELECT id FROM categories WHERE slug = 'headphones' LIMIT 1), true, 2),
('AirPods', 'airpods', 'Apple AirPods', (SELECT id FROM categories WHERE slug = 'headphones' LIMIT 1), true, 3),

-- Speakers subcategories
('Bluetooth Speakers', 'bluetooth-speakers', 'Portable Bluetooth speakers', (SELECT id FROM categories WHERE slug = 'speakers' LIMIT 1), true, 1),
('Home Audio', 'home-audio', 'Home speaker systems', (SELECT id FROM categories WHERE slug = 'speakers' LIMIT 1), true, 2),
('Soundbars', 'soundbars', 'TV soundbars', (SELECT id FROM categories WHERE slug = 'speakers' LIMIT 1), true, 3),

-- Professional Audio subcategories
('Studio Equipment', 'studio-equipment', 'Studio monitors and mics', (SELECT id FROM categories WHERE slug = 'professional-audio' LIMIT 1), true, 1),
('Business Audio', 'business-audio', 'Conference systems', (SELECT id FROM categories WHERE slug = 'professional-audio' LIMIT 1), true, 2),

-- Consoles subcategories
('PS5', 'ps5', 'PlayStation 5', (SELECT id FROM categories WHERE slug = 'consoles' LIMIT 1), true, 1),
('Xbox Series', 'xbox-series', 'Xbox Series X/S', (SELECT id FROM categories WHERE slug = 'consoles' LIMIT 1), true, 2),
('Nintendo Switch', 'nintendo-switch', 'Nintendo Switch', (SELECT id FROM categories WHERE slug = 'consoles' LIMIT 1), true, 3),

-- PC Gaming subcategories
('Gaming Laptops', 'gaming-laptops', 'High-performance gaming laptops', (SELECT id FROM categories WHERE slug = 'pc-gaming' LIMIT 1), true, 1),
('Gaming PCs', 'gaming-pcs', 'Custom gaming desktops', (SELECT id FROM categories WHERE slug = 'pc-gaming' LIMIT 1), true, 2),
('Graphics Cards', 'graphics-cards', 'GPUs and graphics cards', (SELECT id FROM categories WHERE slug = 'pc-gaming' LIMIT 1), true, 3),

-- Gaming Accessories subcategories
('Controllers', 'controllers', 'Gaming controllers', (SELECT id FROM categories WHERE slug = 'gaming-accessories' LIMIT 1), true, 1),
('Gaming Gear', 'gaming-gear', 'Headsets, keyboards and mice', (SELECT id FROM categories WHERE slug = 'gaming-accessories' LIMIT 1), true, 2),

-- Cameras subcategories
('DSLR', 'dslr-cameras', 'Digital SLR cameras', (SELECT id FROM categories WHERE slug = 'cameras' LIMIT 1), true, 1),
('Mirrorless', 'mirrorless-cameras', 'Mirrorless cameras', (SELECT id FROM categories WHERE slug = 'cameras' LIMIT 1), true, 2),
('Action Cameras', 'action-cameras', 'GoPro and action cams', (SELECT id FROM categories WHERE slug = 'cameras' LIMIT 1), true, 3),

-- Drones & Gimbals subcategories
('DJI Drones', 'dji-drones', 'DJI drones', (SELECT id FROM categories WHERE slug = 'drones-gimbals' LIMIT 1), true, 1),
('Gimbals', 'gimbals', 'Camera gimbals', (SELECT id FROM categories WHERE slug = 'drones-gimbals' LIMIT 1), true, 2),

-- Camera Accessories subcategories
('Lenses', 'camera-lenses', 'Camera lenses', (SELECT id FROM categories WHERE slug = 'camera-accessories' LIMIT 1), true, 1),
('Storage & Bags', 'storage-bags', 'Memory cards and bags', (SELECT id FROM categories WHERE slug = 'camera-accessories' LIMIT 1), true, 2),

-- Smartwatches subcategories
('Apple Watch', 'apple-watch', 'Apple Watch', (SELECT id FROM categories WHERE slug = 'smartwatches' LIMIT 1), true, 1),
('Galaxy Watch', 'galaxy-watch', 'Samsung Galaxy Watch', (SELECT id FROM categories WHERE slug = 'smartwatches' LIMIT 1), true, 2),
('Garmin', 'garmin-watches', 'Garmin watches', (SELECT id FROM categories WHERE slug = 'smartwatches' LIMIT 1), true, 3),

-- Fitness & Audio subcategories
('Fitness Trackers', 'fitness-trackers', 'Fitness bands', (SELECT id FROM categories WHERE slug = 'fitness-audio' LIMIT 1), true, 1),
('Wireless Earbuds', 'fitness-earbuds', 'Sport earbuds', (SELECT id FROM categories WHERE slug = 'fitness-audio' LIMIT 1), true, 2),

-- Smart Glasses subcategories
('Audio Glasses', 'audio-glasses', 'Audio glasses', (SELECT id FROM categories WHERE slug = 'smart-glasses' LIMIT 1), true, 1),
('AR Glasses', 'ar-glasses', 'Augmented reality glasses', (SELECT id FROM categories WHERE slug = 'smart-glasses' LIMIT 1), true, 2),

-- Smart TVs subcategories
('Samsung QLED', 'samsung-qled', 'Samsung QLED TVs', (SELECT id FROM categories WHERE slug = 'smart-tvs' LIMIT 1), true, 1),
('LG OLED', 'lg-oled', 'LG OLED TVs', (SELECT id FROM categories WHERE slug = 'smart-tvs' LIMIT 1), true, 2),
('TCL Hisense', 'tcl-hisense', 'TCL and Hisense TVs', (SELECT id FROM categories WHERE slug = 'smart-tvs' LIMIT 1), true, 3),

-- Connectivity subcategories
('Starlink', 'starlink', 'Starlink internet', (SELECT id FROM categories WHERE slug = 'connectivity' LIMIT 1), true, 1),
('Mesh WiFi', 'mesh-wifi', 'Mesh WiFi systems', (SELECT id FROM categories WHERE slug = 'connectivity' LIMIT 1), true, 2),
('WiFi 7 Routers', 'wifi7-routers', 'WiFi 7 routers', (SELECT id FROM categories WHERE slug = 'connectivity' LIMIT 1), true, 3),

-- Streaming & Smart subcategories
('Apple TV', 'apple-tv', 'Apple TV', (SELECT id FROM categories WHERE slug = 'streaming-smart' LIMIT 1), true, 1),
('Chromecast', 'chromecast', 'Google Chromecast', (SELECT id FROM categories WHERE slug = 'streaming-smart' LIMIT 1), true, 2),
('Smart Lights', 'smart-lights', 'Smart lighting', (SELECT id FROM categories WHERE slug = 'streaming-smart' LIMIT 1), true, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count categories by level
SELECT 
  CASE 
    WHEN parent_id IS NULL THEN 'Level 1'
    WHEN (SELECT parent_id FROM categories c2 WHERE c2.id = categories.parent_id) IS NULL THEN 'Level 2'
    ELSE 'Level 3'
  END as level,
  COUNT(*) as count
FROM categories
GROUP BY level
ORDER BY level;
