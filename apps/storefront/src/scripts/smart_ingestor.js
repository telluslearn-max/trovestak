const fs = require('fs');
const path = require('path');

const CSV_PATH = 'c:\\Users\\Administrator\\Documents\\ANTIGRAVITY\\tellus\\Suppliers\\master.csv';
const OUTPUT_SQL_PATH = 'c:\\Users\\Administrator\\Documents\\ANTIGRAVITY\\tellus\\Suppliers\\ingest_catalog.sql';

function normalizeProductName(rawName, brand, navSub) {
    let name = rawName.replace(/[\*\📌]/g, '').replace(/\s+/g, ' ').trim();

    // Storage/RAM formatting
    name = name.replace(/(\d+)\s*(GB|TB)/gi, (match, p1, p2) => p1 + p2.toUpperCase());

    // RAM/Storage separator
    name = name.replace(/(\d+GB)\s+(\d+GB|TB)/gi, '$1/$2');

    // Brand Prefix
    const brandName = brand.split(' ')[0].trim();
    if (!name.toLowerCase().startsWith(brandName.toLowerCase())) {
        name = `${brandName} ${name}`;
    }

    // Deduplicate starting brand if repeated
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
        parts.shift();
        name = parts.join(' ');
    }

    return name;
}

function generateSlug(name) {
    return name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .trim();
}

function parseCSV(content) {
    const lines = content.split('\n');
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Improved CSV split for quotes
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        const row = [];
        let m;
        while ((m = regex.exec(line)) !== null) {
            row.push(m[1].replace(/^"|"$/g, '').trim());
        }

        if (row.length < 7) {
            // Fallback for lines with empty fields that regex might skip
            const simpleRow = line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
            if (simpleRow.length >= 7) {
                results.push({
                    nav_category: simpleRow[0],
                    nav_subcategory: simpleRow[1],
                    brand_type: simpleRow[2],
                    source: simpleRow[3],
                    raw_product: simpleRow[4],
                    sku: simpleRow[5],
                    price: parseInt(simpleRow[6].replace(/[^\d]/g, '') || '0'),
                    notes: simpleRow[7] || ''
                });
                continue;
            }
            continue;
        }

        results.push({
            nav_category: row[0],
            nav_subcategory: row[1],
            brand_type: row[2],
            source: row[3],
            raw_product: row[4],
            sku: row[5],
            price: parseInt(row[6].replace(/[^\d]/g, '') || '0'),
            notes: row[7] || ''
        });
    }
    return results;
}

function escapeSQL(str) {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
}

async function run() {
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const rawData = parseCSV(content);

    const products = new Map();
    const suppliers = new Set();

    for (const item of rawData) {
        const normalizedName = normalizeProductName(item.raw_product, item.brand_type, item.nav_subcategory);
        const slug = generateSlug(normalizedName);
        suppliers.add(item.source);

        if (!products.has(slug) || item.price < products.get(slug).bestPrice) {
            products.set(slug, {
                name: normalizedName,
                slug: slug,
                nav_category: item.nav_category,
                nav_subcategory: item.nav_subcategory,
                brand_type: item.brand_type,
                bestPrice: item.price,
                bestSource: item.source,
                notes: item.notes,
                allOffers: [{ source: item.source, price: item.price, notes: item.notes }]
            });
        } else {
            products.get(slug).allOffers.push({ source: item.source, price: item.price, notes: item.notes });
        }
    }

    let sql = `-- Trovestak Catalog Ingestion SQL
-- Generated on ${new Date().toISOString()}

BEGIN;

-- 1. Ensure Suppliers Exist
${Array.from(suppliers).map(s => `INSERT INTO public.supplier (name) VALUES (${escapeSQL(s)}) ON CONFLICT (name) DO NOTHING;`).join('\n')}

-- 2. Upsert Products
TEMP TABLE product_ids (slug text, id uuid);

${Array.from(products.values()).map(p => `
INSERT INTO public.products (name, slug, nav_category, nav_subcategory, brand_type, enrichment_status)
VALUES (${escapeSQL(p.name)}, ${escapeSQL(p.slug)}, ${escapeSQL(p.nav_category)}, ${escapeSQL(p.nav_subcategory)}, ${escapeSQL(p.brand_type)}, 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  nav_category = EXCLUDED.nav_category,
  nav_subcategory = EXCLUDED.nav_subcategory,
  brand_type = EXCLUDED.brand_type
RETURNING id;`).join('\n')}

-- 3. Upsert Variants & Offers (Simplified for this script)
-- Note: In a real environment, we'd associate the lowest price offer with the primary variant.
-- For this ingestion, we'll create a single "Base" variant for each product.

${Array.from(products.values()).map(p => `
DO $$
DECLARE
    v_product_id UUID;
    v_variant_id UUID;
BEGIN
    SELECT id INTO v_product_id FROM public.products WHERE slug = ${escapeSQL(p.slug)};
    
    INSERT INTO public.product_variants (product_id, name, price_kes, sku)
    VALUES (v_product_id, 'Base', ${p.bestPrice}, ${escapeSQL(p.slug + '-base')})
    ON CONFLICT (sku) DO UPDATE SET
      price_kes = EXCLUDED.price_kes
    RETURNING id INTO v_variant_id;

    -- Add the best offer
    INSERT INTO public.supplier_product_offer (supplier_id, variant_id, cost_price_kes, is_primary)
    VALUES ((SELECT id FROM public.supplier WHERE name = ${escapeSQL(p.bestSource)}), v_variant_id, ${p.bestPrice}, true)
    ON CONFLICT DO NOTHING;
END $$;
`).join('\n')}

COMMIT;
`;

    fs.writeFileSync(OUTPUT_SQL_PATH, sql);
    console.log(`Generated SQL at ${OUTPUT_SQL_PATH}`);
}

run();
