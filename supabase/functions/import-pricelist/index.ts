// Pricelist Import Edge Function
// Handles parsing of WhatsApp text, CSV, and Excel pricelists

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WhatsApp Chat Export & Plain Text Stripping
const WHATSAPP_TIMESTAMP = /^\[\d{2}\/\d{2}(?:\/\d{4})?,\s*\d{2}:\d{2}\]\s+[^:]+:\s*/;
const WHATSAPP_TIMESTAMP_ALT = /^\[\d{4}\/\d{2}\/\d{2},\s*\d{2}:\d{2}\]\s+[^:]+:\s*/;

function stripWhatsAppHeader(line: string): string {
    return line
        .replace(WHATSAPP_TIMESTAMP, '')
        .replace(WHATSAPP_TIMESTAMP_ALT, '')
        .replace(/^\d+[:.)]\s*/, '') // Strip leading numbers like "1: ", "1. ", "1) "
        .trim();
}

// Metadata Extraction
interface ExtractedMetadata {
    condition: 'new' | 'refurbished' | 'used' | 'ex_uk' | 'non_active';
    regionOrigin: 'east_africa' | 'dubai' | 'uk' | 'usa' | 'global' | null;
    simType: 'sim' | 'esim' | 'dual_sim' | 'sim_esim' | null;
    warrantyType: 'none' | '1_year' | '2_year_ea' | '6_month' | 'ex_uk' | null;
    batteryHealth: number | null;
    isOutOfStock: boolean;
}

function extractMetadata(rawLine: string): ExtractedMetadata {
    const line = rawLine.toUpperCase();
    return {
        condition: line.includes('EX-UK') ? 'ex_uk'
            : line.includes('REFURB') ? 'refurbished'
                : line.includes('USED') || line.includes('CLEAN UNIT') ? 'used'
                    : line.includes('NON-ACTIVE') || line.includes('NON ACTIVE') ? 'non_active'
                        : 'new',
        regionOrigin: line.includes('EAST AFRICA') || line.includes('(EA)') ? 'east_africa'
            : line.includes('DUBAI') || line.includes('(DXB)') ? 'dubai'
                : line.includes('EX-UK') || line.includes('UK') ? 'uk'
                    : null,
        simType: line.includes('E-SIM') || line.includes('ESIM') ? 'esim'
            : line.includes('SIM E/A') || line.includes('SIM+ESIM') ? 'sim_esim'
                : line.includes('SIM') ? 'sim'
                    : null,
        warrantyType: line.includes('2 YEAR') || line.includes('24 MONTH') ? '2_year_ea'
            : line.includes('1 YEAR') || line.includes('12 MONTH') ? '1_year'
                : line.includes('NO WARRANTY') || line.includes('#NO WARRANTY') ? 'none'
                    : null,
        batteryHealth: (() => {
            const m = rawLine.match(/BH\s*(\d{2,3})%/i);
            return m ? parseInt(m[1]) : null;
        })(),
        isOutOfStock: rawLine.includes('❌'),
    };
}

// Price Normalization
function normalizePrice(raw: string): number | null {
    let cleaned = raw
        .replace(/KES|Ksh|ksh|kes|KSH|\/=/gi, '')
        .replace(/[^\d.,k]/gi, '')
        .trim();

    if (raw.includes('❌')) return null;

    const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)k$/i);
    if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000) * 100;

    cleaned = cleaned.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    if (num < 500 || num > 10000000) return null;

    return Math.round(num * 100);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { supplierId, rawText, format, commit = false } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
        const supabaseServiceKey = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? "" // Use the renamed secret
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch existing catalog for matching
        const { data: catalog, error: catalogError } = await supabase
            .from('products')
            .select(`
                id, 
                name, 
                slug,
                product_mesh_node(brand, model_family),
                product_variants(id, name, sku, price_kes)
            `)
            .eq('is_active', true);

        if (catalogError) throw new Error(`Catalog fetch failed: ${catalogError.message}`);
        console.log(`Matched catalog size: ${catalog?.length || 0}`);
        if (catalog && catalog.length > 0) {
            console.log("Catalog Item 0 Sample:", JSON.stringify(catalog[0]));
        }

        // 2. Pre-process text
        const lines = rawText.split('\n');
        const processedLines = lines.map(line => stripWhatsAppHeader(line)).filter(l => l.length > 0);
        console.log(`Lines to process: ${processedLines.length}`);

        // 3. Parse into rows with matching logic
        const results = processedLines.map(line => {
            const metadata = extractMetadata(line);
            // More robust price match: look for digits possibly followed by 'k' and ignore trailing non-alphanumeric
            const priceMatch = line.match(/(\d+(?:,\d+)?k?|\d+)[^a-zA-Z0-9]*$/i);
            const price = priceMatch ? normalizePrice(priceMatch[1]) : null;
            const productName = line.replace(priceMatch ? priceMatch[0] : '', '').replace(/[*_#]/g, '').trim();

            console.log(`Line: "${line.substring(0, 30)}..." | Price: ${price} | Name: "${productName}"`);

            if (!price) return null;

            // Simple Keyword Matching
            let matchedVariantId = null;
            let matchStatus = 'new'; // default
            let matchedProductName = null;

            for (const product of catalog) {
                const meshNode = Array.isArray(product.product_mesh_node)
                    ? product.product_mesh_node[0]
                    : product.product_mesh_node;
                const brand = meshNode?.brand?.toUpperCase() || "";
                const modelFamily = meshNode?.model_family?.toUpperCase() || "";
                const nameUpper = productName.toUpperCase();

                // Fuzzy Brand Matching
                const brandMatch = (brand === 'APPLE' && (nameUpper.includes('IPHONE') || /1[1-7](PRO|MAX|MINI|PLUS|AIR)/i.test(nameUpper) || /IP\d+/i.test(nameUpper)))
                    || (brand === 'SAMSUNG' && (nameUpper.includes('S2') || nameUpper.includes('FOLD') || nameUpper.includes('FLIP')))
                    || (brand !== "" && nameUpper.includes(brand));

                // Fuzzy Family Matching
                const familyModel = modelFamily.toUpperCase();
                const seriesMatch = familyModel.match(/\d+/);
                const series = seriesMatch ? seriesMatch[0] : null;

                let familyMatch = (modelFamily !== "" && nameUpper.includes(familyModel))
                    || (familyModel.startsWith('IPHONE') && nameUpper.includes(familyModel.replace('IPHONE ', '').replace(' ', '')))
                    || (familyModel.startsWith('PIXEL') && nameUpper.includes(familyModel.replace('PIXEL ', '')));

                // Strict Series Matching for Apple/Samsung
                if (series && (brand === 'APPLE' || brand === 'SAMSUNG')) {
                    const tokens = nameUpper.split(/[\s+/.\-,]/);
                    const hasSeries = tokens.some(t => t === series || (series.length > 1 && t.includes(series)));
                    if (!hasSeries) {
                        familyMatch = false;
                    } else {
                        familyMatch = true;
                    }
                }

                if (brandMatch && familyMatch) {
                    // Check for keyword mismatch (e.g. line has PRO but product doesn't)
                    const keywords = ['PRO', 'MAX', 'ULTRA', 'PLUS', 'MINI', 'FOLD', 'FLIP', 'AIR'];
                    const lineKeywords = keywords.filter(k => nameUpper.includes(k));
                    const productKeywords = keywords.filter(k => product.name.toUpperCase().includes(k));

                    // If line specifies a keyword, product MUST have it. 
                    // If product has a keyword, line MUST have it (mostly).
                    const keywordMatch = lineKeywords.every(k => productKeywords.includes(k)) &&
                        productKeywords.every(k => lineKeywords.includes(k));

                    if (keywordMatch) {
                        for (const variant of product.product_variants) {
                            const variantNameUpper = variant.name.toUpperCase().replace('GB', '');
                            const tokens = nameUpper.split(/[\s+/.\-,]/);
                            const hasVariant = tokens.some(t => t === variantNameUpper || t === variantNameUpper + 'G' || t === variantNameUpper + 'GB' || t.includes(variantNameUpper + 'GB'));
                            if (hasVariant) {
                                matchedVariantId = variant.id;
                                matchedProductName = `${product.name} (${variant.name})`;
                                matchStatus = 'update';
                                break;
                            }
                        }
                    }
                }
                if (matchedVariantId) {
                    break;
                }
            }

            return {
                productName,
                costPrice: price,
                metadata,
                variantId: matchedVariantId,
                matchedProduct: matchedProductName,
                status: matchStatus,
                rawLine: line
            };
        }).filter(row => row !== null);

        // 4. Persistence (if commit is true)
        if (commit && results.length > 0) {
            console.log(`Committing ${results.length} offers for supplier ${supplierId}`);

            // Insert/Update supplier_product_offer
            const offers = results.filter(r => r.variantId).map(r => ({
                supplier_id: supplierId,
                variant_id: r.variantId,
                cost_price_kes: r.costPrice,
                condition: r.metadata.condition,
                region_origin: r.metadata.regionOrigin,
                sim_type: r.metadata.simType,
                warranty_type: r.metadata.warrantyType,
                battery_health: r.metadata.batteryHealth,
                is_available: !r.metadata.isOutOfStock,
                raw_line: r.rawLine
            }));

            let persistenceError = null;
            if (offers.length > 0) {
                console.log(`Upserting ${offers.length} offers...`);
                const { error: offerError, data: upsertData } = await supabase
                    .from('supplier_product_offer')
                    .upsert(offers, { onConflict: 'supplier_id,variant_id,condition,region_origin,sim_type' })
                    .select();

                if (offerError) {
                    console.error("Persistence failed:", offerError.message);
                    persistenceError = offerError.message;
                } else {
                    console.log(`Upsert successful: ${upsertData?.length || 0} rows.`);
                }
            }

            return new Response(
                JSON.stringify({
                    message: commit ? (persistenceError ? "Partial Success (Persistence Failed)" : "Pricelist imported and saved") : "Pricelist parsed and matched",
                    supplierId,
                    rowCount: results.length,
                    persistenceError,
                    version: "2026-02-19T21:20:00Z",
                    catalogSize: catalog?.length || 0,
                    results: results
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
