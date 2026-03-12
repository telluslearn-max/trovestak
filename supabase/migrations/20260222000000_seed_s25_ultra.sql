-- Galaxy S25 Ultra — Full PDP Content Seed
-- Complete product entry with all JSONB fields populated

-- First ensure we have a smartphones category
INSERT INTO public.categories (name, slug, is_active)
VALUES ('Smartphones', 'smartphones', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Insert the Galaxy S25 Ultra product with full content
INSERT INTO public.products (
    name,
    slug,
    description,
    thumbnail_url,
    category_id,
    brand_type,
    nav_category,
    nav_subcategory,
    content_overview,
    content_features,
    content_specifications,
    content_qa,
    metadata,
    enrichment_status,
    is_active
) VALUES (
    'Samsung Galaxy S25 Ultra 12GB',
    'samsung-galaxy-s25-ultra',
    'Galaxy AI · Built-in S Pen · 200MP Camera System',
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    (SELECT id FROM public.categories WHERE slug = 'smartphones' LIMIT 1),
    'Samsung',
    'mobile',
    'smartphones',
    'The Galaxy S25 Ultra raises the bar for Android flagships with on-device AI, a 200MP camera system, and the iconic S Pen — all built with aerospace-grade titanium.',
    '[
        { "icon": "🤖", "title": "Galaxy AI — On-Device", "desc": "Circle to Search, Live Translate, and Note Assist run directly on the Snapdragon 8 Elite — no cloud, works offline on Safaricom or Airtel data." },
        { "icon": "📷", "title": "200MP Quad-Camera System", "desc": "A 200MP primary sensor with quad-binning captures stunning low-light shots. 50MP ultrawide + dual-tele (10MP 3× and 50MP 5×) complete the system." },
        { "icon": "✏️", "title": "S Pen. Always Ready.", "desc": "The S Pen lives in the phone — no charge required. 2.8ms latency for notes, sketches, and document signing." },
        { "icon": "⚡", "title": "All-Day and Beyond", "desc": "5,000mAh battery + 45W wired charging: 0→65% in 30 minutes, fast enough for a matatu ride top-up." },
        { "icon": "🏔️", "title": "Titanium. Genuinely.", "desc": "Grade-5 titanium frame — same alloy as aerospace — paired with Corning Gorilla Armor 2 front and back." },
        { "icon": "📡", "title": "Ready for Kenya''s 5G", "desc": "Supports Safaricom 5G (n78, n79) and Airtel Kenya 4G LTE. Wi-Fi 7 and Bluetooth 5.4 included." }
    ]'::jsonb,
    '{
        "Performance": {
            "Chip": "Snapdragon 8 Elite for Galaxy",
            "CPU": "Octa-core (2×4.47GHz + 6×3.53GHz)",
            "RAM": "12GB LPDDR5X",
            "Storage options": "256GB / 512GB / 1TB UFS 4.0"
        },
        "Display": {
            "Size": "6.9-inch Dynamic AMOLED 2X",
            "Resolution": "3088 × 1440 px (QHD+)",
            "Refresh rate": "1–120Hz adaptive",
            "Brightness": "2,600 nits peak",
            "Protection": "Corning Gorilla Armor 2"
        },
        "Camera": {
            "Main": "200MP f/1.7, OIS, multi-directional PDAF",
            "Ultrawide": "50MP f/1.9, 120° FOV",
            "Telephoto 1": "10MP f/2.4, 3× optical OIS",
            "Telephoto 2": "50MP f/3.4, 5× optical OIS",
            "Front": "12MP f/2.2",
            "Video": "8K @ 30fps, 4K @ 120fps"
        },
        "Connectivity": {
            "5G bands": "Sub-6GHz (n78, n79) — Safaricom & Airtel",
            "4G LTE": "Bands 1, 3, 7, 20, 28, 40",
            "Wi-Fi": "Wi-Fi 7 tri-band",
            "Bluetooth": "5.4",
            "NFC": "Yes",
            "USB": "USB-C 3.2 Gen 2 (10Gbps)"
        },
        "Battery": {
            "Capacity": "5,000mAh",
            "Wired charging": "45W (0–65% in 30 min)",
            "Wireless": "15W Qi2",
            "Reverse wireless": "4.5W"
        },
        "Build": {
            "Frame": "Grade-5 titanium",
            "Back": "Gorilla Glass Victus 2",
            "Dimensions": "162.8 × 77.6 × 8.2 mm",
            "Weight": "218g",
            "IP rating": "IP68",
            "Power": "240V, 50Hz compatible",
            "Warranty": "1 Year EA warranty"
        }
    }'::jsonb,
    '[
        { "q": "Can I pay with M-Pesa or Fuliza?", "a": "Yes — we accept M-Pesa Lipa na M-Pesa. For BNPL, use Fuliza for the 3-month zero-interest plan or apply through Equity, KCB, or NCBA for 6 and 12-month plans. First instalment due at checkout." },
        { "q": "Does the S25 Ultra work on Safaricom 5G and Airtel Kenya?", "a": "Yes. Supports Sub-6GHz n78 and n79 (Safaricom 5G) plus all major Airtel 4G LTE bands. Dual-SIM capable." },
        { "q": "Is this an official EA (East Africa) warranty unit?", "a": "Yes. All Samsung devices from Trovestak are EA units — honoured at all Samsung-authorised service centres in Kenya including the Kimathi Street Experience Store." },
        { "q": "How does the trade-in process work?", "a": "Select device + condition in the configurator. At checkout, confirm the trade-in. We arrange free courier pickup (Nairobi) or drop-off at Westlands. Credit applied within 24 hours after inspection." },
        { "q": "Does the charger support Kenya''s 240V power supply?", "a": "Yes. The included 45W EA charger supports 100–240V, 50–60Hz. Plug adapter may be needed (Kenya uses Type G). No voltage converter required." },
        { "q": "How much storage do I need?", "a": "256GB suits most users who stream and use cloud storage. Go 512GB or 1TB if you shoot 4K/8K video or use Samsung DeX. There is no microSD slot." }
    ]'::jsonb,
    '{
        "badge": "New 2025",
        "warranty": "1 Year EA",
        "availability": "in_stock",
        "compare_price": 198000,
        "breadcrumb": ["Home", "Mobile", "Samsung"],
        "colors": [
            { "name": "Titanium Black", "hex1": "#1a1a1c", "hex2": "#252528" },
            { "name": "Titanium Silver", "hex1": "#b8b8bc", "hex2": "#d0d0d4" },
            { "name": "Titanium Blue", "hex1": "#3a5a7a", "hex2": "#4e728e" },
            { "name": "Titanium Jade", "hex1": "#3a6a5a", "hex2": "#4d7a6a" }
        ],
        "addons": {
            "bnpl": true,
            "bnpl_min_price": 20000,
            "trade_in": true,
            "same_day_available": true,
            "insurance": true
        },
        "trade_in_devices": [
            {
                "group": "Samsung Galaxy",
                "items": [
                    { "name": "Galaxy S24 Ultra (2024)", "value": 92000 },
                    { "name": "Galaxy S23 Ultra (2023)", "value": 62000 },
                    { "name": "Galaxy S22 Ultra (2022)", "value": 39000 },
                    { "name": "Galaxy S21 Ultra (2021)", "value": 25000 }
                ]
            },
            {
                "group": "iPhone",
                "items": [
                    { "name": "iPhone 16 Pro Max", "value": 105000 },
                    { "name": "iPhone 15 Pro Max", "value": 88000 },
                    { "name": "iPhone 14 Pro Max", "value": 65000 },
                    { "name": "iPhone 13 Pro Max", "value": 45000 }
                ]
            },
            {
                "group": "Google Pixel",
                "items": [
                    { "name": "Pixel 9 Pro XL", "value": 72000 },
                    { "name": "Pixel 8 Pro", "value": 48000 },
                    { "name": "Pixel 7 Pro", "value": 32000 }
                ]
            }
        ],
        "svg": {
            "type": "smartphone",
            "colorIds": ["phoneBody", "btnR"]
        }
    }'::jsonb,
    'approved',
    true
) RETURNING id;

-- Insert variants (storage tiers) — price_kes in CENTS
INSERT INTO public.product_variants (product_id, name, sku, price_kes, stock_quantity, options)
VALUES
    (
        (SELECT id FROM public.products WHERE slug = 'samsung-galaxy-s25-ultra'),
        'Galaxy S25 Ultra',
        'samsung-galaxy-s25-ultra-256gb',
        18500000, -- KES 185,000 in cents
        12,
        '{"storage": "256GB", "desc": "12GB · 256GB UFS 4.0", "is_default": true}'::jsonb
    ),
    (
        (SELECT id FROM public.products WHERE slug = 'samsung-galaxy-s25-ultra'),
        'Galaxy S25 Ultra',
        'samsung-galaxy-s25-ultra-512gb',
        20500000, -- KES 205,000 in cents
        8,
        '{"storage": "512GB", "desc": "12GB · 512GB UFS 4.0"}'::jsonb
    ),
    (
        (SELECT id FROM public.products WHERE slug = 'samsung-galaxy-s25-ultra'),
        'Galaxy S25 Ultra',
        'samsung-galaxy-s25-ultra-1tb',
        23500000, -- KES 235,000 in cents
        4,
        '{"storage": "1TB", "desc": "12GB · 1TB UFS 4.0"}'::jsonb
    );

-- Create mesh node for ecosystem recommendations
INSERT INTO public.product_mesh_node (product_id, brand, model_family, category_slug, compute_class)
VALUES (
    (SELECT id FROM public.products WHERE slug = 'samsung-galaxy-s25-ultra'),
    'Samsung',
    'Galaxy S25',
    'smartphones',
    'high'
) ON CONFLICT (product_id) DO UPDATE SET 
    brand = EXCLUDED.brand,
    model_family = EXCLUDED.model_family,
    category_slug = EXCLUDED.category_slug,
    compute_class = EXCLUDED.compute_class;
