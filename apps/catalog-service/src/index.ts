import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createLogger, createSupabaseAdminClient } from '@trovestak/shared';

const log = createLogger('catalog-service');
const PORT = parseInt(process.env.PORT || '8083');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SERVICE_SECRET = process.env.SERVICE_SECRET || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    log.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
}

const supabase = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(express.json({ limit: '5mb' }));

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireServiceToken(req: Request, res: Response, next: NextFunction) {
    if (!SERVICE_SECRET) { next(); return; }
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_SECRET) { res.status(401).json({ error: 'Unauthorized' }); return; }
    next();
}

function slugify(text: string) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

// ── Error wrapper ─────────────────────────────────────────────────────────────
function wrap(fn: (req: Request, res: Response) => Promise<unknown>) {
    return (req: Request, res: Response) => {
        fn(req, res).catch(err => {
            log.error('Request error', { path: req.path, error: err.message });
            res.status(500).json({ error: err.message });
        });
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /products — paginated list
app.get('/products', requireServiceToken, wrap(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let q = supabase.from('products').select('*', { count: 'exact' });

    if (req.query.query) {
        q = q.or(`name.ilike.%${req.query.query}%,slug.ilike.%${req.query.query}%`);
    }
    if (req.query.status) q = q.eq('status', req.query.status as string);
    if (req.query.activeOnly !== undefined) q = q.eq('is_active', req.query.activeOnly === 'true');

    const { data, count, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    res.json({ products: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
}));

// GET /products/list — full list for admin dashboard (no pagination)
app.get('/products/list', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const active = data?.filter(p => p.is_active).length || 0;
    const oos = data?.filter(p => (p.stock_quantity || 0) === 0).length || 0;

    res.json({ products: data || [], stats: { total: data?.length || 0, active, outOfStock: oos } });
}));

// GET /products/search
app.get('/products/search', requireServiceToken, wrap(async (req, res) => {
    const query = (req.query.q as string) || '';
    const exclude = req.query.exclude as string;

    let q = supabase.from('products').select('id, name, slug').ilike('name', `%${query}%`).limit(10);
    if (exclude) q = q.neq('id', exclude);

    const { data, error } = await q;
    if (error) return res.json({ data: [], error: error.message });
    res.json({ data: data || [] });
}));

// GET /products/:id
app.get('/products/:id', requireServiceToken, wrap(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);

    const { data: catData } = await supabase
        .from('product_categories').select('category_id').eq('product_id', id).eq('is_primary', true).maybeSingle();

    res.json({ product: data, primaryCategoryId: catData?.category_id || null });
}));

// GET /products/:id/full
app.get('/products/:id/full', requireServiceToken, wrap(async (req, res) => {
    const { id } = req.params;

    const [productRes, pricingRes, variantsRes, specsRes, contentRes, addonsRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_pricing').select('*').eq('product_id', id).maybeSingle(),
        supabase.from('product_variants').select('*').eq('product_id', id),
        supabase.from('product_specs').select('*').eq('product_id', id).maybeSingle(),
        supabase.from('product_content').select('*').eq('product_id', id).maybeSingle(),
        supabase.from('product_addons').select('*').eq('product_id', id),
    ]);

    if (productRes.error || !productRes.data) throw new Error(productRes.error?.message || 'Product not found');

    const product = productRes.data;
    const productPricing = pricingRes.data;
    const variants = variantsRes.data || [];

    const legacyPricing = {
        cost_price: product.cost_price || 0,
        sell_price: product.sell_price || 0,
        compare_price: product.regular_price || 0,
        discount_percent: product.discount_percent || 0,
    };

    const pricing = (productPricing && (productPricing.sell_price > 0 || productPricing.cost_price > 0))
        ? productPricing : legacyPricing;

    const variantGroups = { colors: [] as unknown[], sizes: [] as unknown[], tiers: [] as unknown[] };
    for (const v of variants) {
        if ((v as any).options?.color) variantGroups.colors.push(v);
        else if ((v as any).options?.storage || (v as any).options?.size) variantGroups.sizes.push(v);
        else variantGroups.tiers.push(v);
    }

    res.json({ product, pricing, variants: variantGroups, specs: specsRes.data, content: contentRes.data, addons: addonsRes.data || [] });
}));

// POST /products — upsert (create or update)
app.post('/products', requireServiceToken, wrap(async (req, res) => {
    const { id, payload, primaryCategoryId } = req.body as { id: string | null; payload: Record<string, unknown>; primaryCategoryId?: string };

    let result;
    if (id) {
        result = await supabase.from('products')
            .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    } else {
        result = await supabase.from('products')
            .insert({ ...payload, is_active: (payload.is_active as boolean) ?? true }).select().single();
    }

    if (result.error) throw new Error(result.error.message);
    const savedProduct = result.data;

    if (primaryCategoryId) {
        await supabase.from('product_categories').delete().eq('product_id', savedProduct.id);
        await supabase.from('product_categories').insert({
            product_id: savedProduct.id, category_id: primaryCategoryId, is_primary: true,
        });
    }

    res.json({ success: true, product: savedProduct });
}));

// POST /products/create — full product creation with variants (fromData converted to JSON)
app.post('/products/create', requireServiceToken, wrap(async (req, res) => {
    const {
        name, description, image_url, category_id, brand_type, nav_category, nav_subcategory,
        content_overview, variants_json, specs_json, features_json, qa_json, colors_json,
        addons_json, trade_in_json, badge, compare_price, warranty, availability,
    } = req.body as Record<string, string | null>;

    if (!name || !variants_json) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
    }

    const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 8)}`;

    let content_specifications: Record<string, Record<string, string>> = {};
    try {
        const specGroups = JSON.parse(specs_json ?? '[]');
        specGroups.forEach((group: Record<string, unknown>) => {
            if (group.groupName && Array.isArray(group.items) && group.items.length > 0) {
                const groupItems: Record<string, string> = {};
                (group.items as Array<{ key: string; value: string }>).forEach(item => {
                    if (item.key && item.value) groupItems[item.key] = item.value;
                });
                if (Object.keys(groupItems).length > 0) content_specifications[group.groupName as string] = groupItems;
            }
        });
    } catch (e) { log.warn('Spec parse error', { e }); }

    let content_features: unknown[] = [];
    try { content_features = JSON.parse(features_json ?? '[]'); } catch (e) { /* ignore */ }

    let content_qa: unknown[] = [];
    try { content_qa = JSON.parse(qa_json ?? '[]'); } catch (e) { /* ignore */ }

    let colors: unknown[] = [];
    try { colors = JSON.parse(colors_json ?? '[]'); } catch (e) { /* ignore */ }

    let addons: Record<string, unknown> = {};
    try { addons = JSON.parse(addons_json ?? '{}'); } catch (e) { /* ignore */ }

    let trade_in_devices: unknown[] = [];
    try { trade_in_devices = JSON.parse(trade_in_json ?? '[]'); } catch (e) { /* ignore */ }

    const comparePrice = compare_price ? parseFloat(compare_price) : undefined;

    const metadata: Record<string, unknown> = {
        ...(badge ? { badge } : {}),
        ...(comparePrice ? { compare_price: comparePrice } : {}),
        ...(warranty ? { warranty } : {}),
        ...(availability ? { availability } : {}),
        ...(colors.length > 0 ? { colors } : {}),
        ...(Object.keys(addons).length > 0 ? { addons } : {}),
        ...(trade_in_devices.length > 0 ? { trade_in_devices } : {}),
        breadcrumb: ['Home', nav_category || 'Store', brand_type || 'Brand'].filter(Boolean),
    };

    const { data: product, error: productError } = await supabase.from('products').insert({
        name, slug, description, thumbnail_url: image_url,
        category_id: category_id === '' ? null : category_id,
        brand_type, nav_category: nav_category || null, nav_subcategory: nav_subcategory || null,
        content_overview, content_specifications, content_features, content_qa, metadata,
        enrichment_status: 'approved', is_active: true,
    }).select().single();

    if (productError || !product) {
        log.error('Product creation error', { error: productError });
        res.status(500).json({ success: false, error: productError?.message ?? 'Failed to create product record' });
        return;
    }

    try {
        const variantInputs = JSON.parse(variants_json);
        const variantsToInsert = variantInputs.map((v: Record<string, string>, idx: number) => ({
            product_id: product.id,
            name: v.name || 'Standard',
            options: {
                storage: v.storage || null, color: v.color || null, is_default: idx === 0,
                desc: v.storage ? `${v.storage} · ${v.color || ''}`.trim().replace(/·\s*$/, '') : null,
            },
            price_kes: v.price_kes ? Math.round(parseFloat(v.price_kes) * 100) : 0,
            stock_quantity: parseInt(v.stock_quantity ?? '0') || 0,
            sku: `${slug}-${slugify(v.storage || `v${idx}`)}-${slugify(v.color || 'std')}`,
        }));

        const { error: variantError } = await supabase.from('product_variants').insert(variantsToInsert);
        if (variantError) {
            log.error('Variant creation error', { error: variantError });
            res.json({ success: false, error: 'Product created, but variants failed.' });
            return;
        }
    } catch (e) {
        log.error('Variant parse error', { e });
        res.json({ success: false, error: 'Invalid variant data.' });
        return;
    }

    res.json({ success: true, id: product.id, slug });
}));

// DELETE /products/:id
app.delete('/products/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /products/:id/gallery
app.patch('/products/:id/gallery', requireServiceToken, wrap(async (req, res) => {
    const { galleryUrls } = req.body as { galleryUrls: string[] };
    const { error } = await supabase.from('products')
        .update({ gallery_urls: galleryUrls, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /products/:id/brand
app.patch('/products/:id/brand', requireServiceToken, wrap(async (req, res) => {
    const { brandSlug } = req.body as { brandSlug: string };
    const { error } = await supabase.from('products').update({ brand_type: brandSlug }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /products/bulk/category
app.post('/products/bulk/category', requireServiceToken, wrap(async (req, res) => {
    const { productIds, categoryId } = req.body as { productIds: string[]; categoryId: string };
    const { error } = await supabase.from('products')
        .update({ category_id: categoryId, updated_at: new Date().toISOString() }).in('id', productIds);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /products/bulk/prices
app.post('/products/bulk/prices', requireServiceToken, wrap(async (req, res) => {
    const { productIds, type, value, direction } = req.body as {
        productIds: string[]; type: 'percentage' | 'fixed'; value: number; direction: 'increase' | 'decrease';
    };

    const { data: variants, error: fetchError } = await supabase
        .from('product_variants').select('id, price_kes').in('product_id', productIds);
    if (fetchError) throw new Error(fetchError.message);
    if (!variants || variants.length === 0) { res.json({ success: true, updated: 0 }); return; }

    const updates = variants.map(v => {
        let newPrice = v.price_kes || 0;
        if (type === 'percentage') {
            const adjustment = Math.round(newPrice * (value / 100));
            newPrice = direction === 'increase' ? newPrice + adjustment : newPrice - adjustment;
        } else {
            const adjustmentCents = value * 100;
            newPrice = direction === 'increase' ? newPrice + adjustmentCents : newPrice - adjustmentCents;
        }
        return { id: v.id, price_kes: Math.max(0, newPrice), updated_at: new Date().toISOString() };
    });

    const { error: updateError } = await supabase.from('product_variants').upsert(updates);
    if (updateError) throw new Error(updateError.message);

    res.json({ success: true, updated: updates.length });
}));

// POST /products/bulk/delete
app.post('/products/bulk/delete', requireServiceToken, wrap(async (req, res) => {
    const { productIds } = req.body as { productIds: string[] };
    const { error } = await supabase.from('products').delete().in('id', productIds);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /products/bulk/toggle
app.post('/products/bulk/toggle', requireServiceToken, wrap(async (req, res) => {
    const { productIds, active } = req.body as { productIds: string[]; active: boolean };
    const { error } = await supabase.from('products')
        .update({ is_active: active, updated_at: new Date().toISOString() }).in('id', productIds);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /products/bulk/upsert
app.post('/products/bulk/upsert', requireServiceToken, wrap(async (req, res) => {
    const { productsData } = req.body as { productsData: Record<string, unknown>[] };
    const { data, error } = await supabase.from('products')
        .upsert(productsData.map(p => ({ ...p, updated_at: new Date().toISOString() }))).select();
    if (error) throw new Error(error.message);
    res.json({ success: true, count: data?.length || 0 });
}));

// POST /products/bulk/brand
app.post('/products/bulk/brand', requireServiceToken, wrap(async (req, res) => {
    const { productIds, brandSlug } = req.body as { productIds: string[]; brandSlug: string };
    const { error } = await supabase.from('products').update({ brand_type: brandSlug }).in('id', productIds);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

// PATCH /variants/:id/price
app.patch('/variants/:id/price', requireServiceToken, wrap(async (req, res) => {
    const { priceRaw } = req.body as { priceRaw: string | null };
    let price_kes: number | null = null;
    if (priceRaw && priceRaw.trim() !== '') price_kes = Math.round(parseFloat(priceRaw) * 100);

    const { error } = await supabase.from('product_variants')
        .update({ price_kes, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /variants/:id/cost
app.patch('/variants/:id/cost', requireServiceToken, wrap(async (req, res) => {
    const { costPrice } = req.body as { costPrice: number };
    const costPriceCents = Math.round(costPrice * 100);

    const { data: existingOffer } = await supabase
        .from('supplier_product_offer').select('id').eq('variant_id', req.params.id).maybeSingle();

    if (existingOffer) {
        const { error } = await supabase.from('supplier_product_offer')
            .update({ cost_price: costPriceCents, last_updated: new Date().toISOString() }).eq('id', existingOffer.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase.from('supplier_product_offer')
            .insert({ variant_id: req.params.id, cost_price: costPriceCents, currency: 'KES' });
        if (error) throw new Error(error.message);
    }
    res.json({ success: true });
}));

// GET /variants/search
app.get('/variants/search', requireServiceToken, wrap(async (req, res) => {
    const query = (req.query.q as string) || '';
    const { data, error } = await supabase.from('product_variants')
        .select('id, name, sku, price_kes, stock_quantity, products(id, name, thumbnail_url)')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`).limit(10);
    if (error) { res.json([]); return; }
    res.json(data);
}));

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT RELATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /products/:id/relations
app.post('/products/:id/relations', requireServiceToken, wrap(async (req, res) => {
    const { toId, type, strength = 1.0 } = req.body as { toId: string; type: string; strength?: number };
    const { data, error } = await supabase.from('product_relation')
        .insert({ from_product_id: req.params.id, to_product_id: toId, relation_type: type, strength })
        .select('*, to_product:products!to_product_id(id, name, thumbnail_url, slug)').single();
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
}));

// PUT /products/:id/relations — bulk replace (compatible_with)
app.put('/products/:id/relations', requireServiceToken, wrap(async (req, res) => {
    const { relatedProductIds } = req.body as { relatedProductIds: string[] };
    await supabase.from('product_relation').delete().eq('from_product_id', req.params.id);

    if (relatedProductIds.length > 0) {
        const relations = relatedProductIds.map(toProductId => ({
            from_product_id: req.params.id, to_product_id: toProductId,
            relation_type: 'compatible_with', strength: 1.0,
        }));
        const { error } = await supabase.from('product_relation').insert(relations);
        if (error) throw new Error(error.message);
    }
    res.json({ success: true });
}));

// DELETE /relations/:id
app.delete('/relations/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('product_relation').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /relations/:id/strength
app.patch('/relations/:id/strength', requireServiceToken, wrap(async (req, res) => {
    const { strength } = req.body as { strength: number };
    const { error } = await supabase.from('product_relation')
        .update({ strength, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRIBUTE GROUPS & TERMS (product-level specs)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /attribute-groups
app.get('/attribute-groups', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('product_attribute_groups')
        .select('*, terms:product_attribute_terms(*)')
        .order('position', { ascending: true }).order('name');
    if (error) throw new Error(error.message);
    res.json(data || []);
}));

// POST /attribute-groups (create)
app.post('/attribute-groups', requireServiceToken, wrap(async (req, res) => {
    const { data: newGroup, error } = await supabase.from('product_attribute_groups')
        .insert(req.body).select().single();
    if (error) throw new Error(error.message);
    res.json(newGroup);
}));

// PATCH /attribute-groups/:id (update)
app.patch('/attribute-groups/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('product_attribute_groups').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /attribute-groups/:id
app.delete('/attribute-groups/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('product_attribute_groups').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /attribute-terms (create)
app.post('/attribute-terms', requireServiceToken, wrap(async (req, res) => {
    const { data: newTerm, error } = await supabase.from('product_attribute_terms')
        .insert(req.body).select().single();
    if (error) throw new Error(error.message);
    res.json(newTerm);
}));

// PATCH /attribute-terms/:id (update)
app.patch('/attribute-terms/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('product_attribute_terms').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /attribute-terms/:id
app.delete('/attribute-terms/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('product_attribute_terms').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRIBUTES & VALUES (variant-level filter attributes)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /attributes
app.get('/attributes', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('attributes')
        .select('*, attribute_values(id, value, hex_color, sort_order)')
        .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    res.json(data || []);
}));

// POST /attributes
app.post('/attributes', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('attributes').insert(req.body).select().single();
    if (error) throw new Error(error.message);
    res.json(data);
}));

// PATCH /attributes/:id
app.patch('/attributes/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('attributes').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /attributes/:id
app.delete('/attributes/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('attributes').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /attribute-values
app.post('/attribute-values', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('attribute_values').insert(req.body).select().single();
    if (error) throw new Error(error.message);
    res.json(data);
}));

// PATCH /attribute-values/:id
app.patch('/attribute-values/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('attribute_values').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /attribute-values/:id
app.delete('/attribute-values/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('attribute_values').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /templates
app.get('/templates', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('variant_templates')
        .select('*, variant_template_attributes(attribute_id, attributes:attributes(id, name, slug))')
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    res.json(data || []);
}));

// POST /templates
app.post('/templates', requireServiceToken, wrap(async (req, res) => {
    const { name, slug: slugInput, attribute_ids } = req.body as { name: string; slug: string; attribute_ids: string[] };

    const { data: tmpl, error } = await supabase.from('variant_templates')
        .insert({ name, slug: slugInput }).select().single();
    if (error) throw new Error(error.message);

    if (attribute_ids.length > 0) {
        const rows = attribute_ids.map(aid => ({ template_id: tmpl.id, attribute_id: aid }));
        const { error: linkErr } = await supabase.from('variant_template_attributes').insert(rows);
        if (linkErr) throw new Error(linkErr.message);
    }
    res.json(tmpl);
}));

// PUT /templates/:id/attributes
app.put('/templates/:id/attributes', requireServiceToken, wrap(async (req, res) => {
    const { attribute_ids } = req.body as { attribute_ids: string[] };

    await supabase.from('variant_template_attributes').delete().eq('template_id', req.params.id);

    if (attribute_ids.length > 0) {
        const rows = attribute_ids.map(aid => ({ template_id: req.params.id, attribute_id: aid }));
        const { error } = await supabase.from('variant_template_attributes').insert(rows);
        if (error) throw new Error(error.message);
    }
    res.json({ success: true });
}));

// DELETE /templates/:id
app.delete('/templates/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('variant_templates').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// BUNDLES
// ═══════════════════════════════════════════════════════════════════════════════

const BUNDLE_SELECT = `
    *,
    bundle_items (
        id, quantity, product_variant_id,
        product_variants (id, name, sku, price_kes, stock_quantity, products(id, name, thumbnail_url))
    ),
    bundle_slots (
        id, slot_name, required, sort_order,
        bundle_slot_options (
            id, price_modifier, product_variant_id,
            product_variants (id, name, sku, price_kes, stock_quantity, products(id, name, thumbnail_url))
        )
    )
`;

// GET /bundles
app.get('/bundles', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('bundles').select(BUNDLE_SELECT).order('created_at', { ascending: false });
    if (error) { log.error('Error fetching bundles', { error }); res.json([]); return; }
    res.json(data);
}));

// GET /bundles/product/:productId
app.get('/bundles/product/:productId', requireServiceToken, wrap(async (req, res) => {
    const { productId } = req.params;
    const { data: variants } = await supabase.from('product_variants').select('id').eq('product_id', productId);
    if (!variants || variants.length === 0) { res.json([]); return; }

    const variantIds = variants.map(v => v.id);
    const [fixedItems, slotOptions] = await Promise.all([
        supabase.from('bundle_items').select('bundle_id, bundles(*)').in('product_variant_id', variantIds),
        supabase.from('bundle_slot_options').select('slot_id, bundle_slots(bundle_id, bundles(*))').in('product_variant_id', variantIds),
    ]);

    const bundlesMap = new Map<string, unknown>();
    fixedItems.data?.forEach(item => { if (item.bundles) bundlesMap.set(item.bundle_id, item.bundles); });
    slotOptions.data?.forEach(opt => {
        const bundle = (opt.bundle_slots as unknown as Record<string, unknown>)?.bundles;
        if (bundle) bundlesMap.set((bundle as Record<string, string>).id, bundle);
    });
    res.json(Array.from(bundlesMap.values()));
}));

// POST /bundles
app.post('/bundles', requireServiceToken, wrap(async (req, res) => {
    const { data: bundle, error } = await supabase.from('bundles').insert([req.body]).select().single();
    if (error) throw new Error(error.message);
    res.json(bundle);
}));

// PATCH /bundles/:id
app.patch('/bundles/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('bundles').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /bundles/:id
app.delete('/bundles/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('bundles').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /bundles/:id/items
app.post('/bundles/:id/items', requireServiceToken, wrap(async (req, res) => {
    const { variantId, quantity = 1 } = req.body as { variantId: string; quantity?: number };
    const { error } = await supabase.from('bundle_items')
        .insert([{ bundle_id: req.params.id, product_variant_id: variantId, quantity }]);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /bundle-items/:id
app.delete('/bundle-items/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('bundle_items').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /bundles/:id/slots
app.post('/bundles/:id/slots', requireServiceToken, wrap(async (req, res) => {
    const { slotName, required = true } = req.body as { slotName: string; required?: boolean };
    const { data, error } = await supabase.from('bundle_slots')
        .insert([{ bundle_id: req.params.id, slot_name: slotName, required }]).select().single();
    if (error) throw new Error(error.message);
    res.json(data);
}));

// DELETE /bundle-slots/:id
app.delete('/bundle-slots/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('bundle_slots').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// POST /bundle-slots/:id/options
app.post('/bundle-slots/:id/options', requireServiceToken, wrap(async (req, res) => {
    const { variantId, priceModifier = 0 } = req.body as { variantId: string; priceModifier?: number };
    const { error } = await supabase.from('bundle_slot_options')
        .insert([{ slot_id: req.params.id, product_variant_id: variantId, price_modifier: priceModifier }]);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /bundle-slot-options/:id
app.delete('/bundle-slot-options/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('bundle_slot_options').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING — Discount Codes & Flash Sales
// ═══════════════════════════════════════════════════════════════════════════════

// GET /discounts
app.get('/discounts', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json(data || []);
}));

// POST /discounts
app.post('/discounts', requireServiceToken, wrap(async (req, res) => {
    const input = req.body as {
        code: string; type: string; value: number; description?: string;
        usage_limit?: number; minimum_order_amount?: number; ends_at?: string;
    };
    const { error } = await supabase.from('discount_codes').insert({
        code: input.code.toUpperCase().trim(), type: input.type, value: input.value,
        description: input.description || null, usage_limit: input.usage_limit || null,
        minimum_order_amount: input.minimum_order_amount || 0, ends_at: input.ends_at || null, is_active: true,
    });
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /discounts/:id/toggle
app.patch('/discounts/:id/toggle', requireServiceToken, wrap(async (req, res) => {
    const { is_active } = req.body as { is_active: boolean };
    const { error } = await supabase.from('discount_codes').update({ is_active }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /discounts/:id
app.delete('/discounts/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('discount_codes').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// GET /flash-sales
app.get('/flash-sales', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('flash_sales').select('*').order('starts_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json(data || []);
}));

// POST /flash-sales
app.post('/flash-sales', requireServiceToken, wrap(async (req, res) => {
    const input = req.body as {
        title: string; description?: string; discount_percent: number;
        starts_at: string; ends_at: string; banner_color?: string;
    };
    const { error } = await supabase.from('flash_sales').insert({
        title: input.title, description: input.description || null,
        discount_percent: input.discount_percent, starts_at: input.starts_at, ends_at: input.ends_at,
        banner_color: input.banner_color || '#ff3b30', is_active: true,
    });
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /flash-sales/:id/toggle
app.patch('/flash-sales/:id/toggle', requireServiceToken, wrap(async (req, res) => {
    const { is_active } = req.body as { is_active: boolean };
    const { error } = await supabase.from('flash_sales').update({ is_active }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// BRANDS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /brands — simple active list
app.get('/brands', requireServiceToken, wrap(async (req, res) => {
    const { data, error } = await supabase.from('brands').select('name, slug')
        .eq('is_active', true).order('name');
    if (error) throw new Error(error.message);
    res.json(data || []);
}));

// GET /brands/with-counts
app.get('/brands/with-counts', requireServiceToken, wrap(async (req, res) => {
    const { data: brands, error: bError } = await supabase.from('brands').select('*').order('name');
    if (bError) throw new Error(bError.message);

    const brandsWithCounts = await Promise.all((brands || []).map(async (brand: Record<string, unknown>) => {
        const { count: pCount } = await supabase
            .from('products').select('id', { count: 'exact', head: true }).eq('brand_type', brand.slug);
        return { ...brand, productCount: pCount || 0 };
    }));
    res.json(brandsWithCounts);
}));

// GET /brands/detail/:slug
app.get('/brands/detail/:slug', requireServiceToken, wrap(async (req, res) => {
    const { slug } = req.params;
    let brand: Record<string, unknown>;

    if (slug === 'uncategorized') {
        brand = { id: 'uncategorized', name: 'Uncategorized', slug: 'uncategorized',
            description: 'Products pending brand assignment', is_virtual: true };
    } else {
        const { data, error } = await supabase.from('brands').select('*').eq('slug', slug).single();
        if (error) throw new Error(error.message);
        brand = data;
    }

    let pQuery = supabase.from('products').select('id, name, slug, thumbnail_url, is_active');
    if (slug === 'uncategorized') {
        pQuery = pQuery.or('brand_type.is.null,brand_type.eq."",brand_type.eq.generic');
    } else {
        pQuery = pQuery.eq('brand_type', slug);
    }
    const { data: products, error: pError } = await pQuery.order('name');
    if (pError) throw new Error(pError.message);

    const { data: brandsList } = await supabase.from('brands').select('name, slug').order('name');

    res.json({ brand, products: products || [], brandsList: brandsList || [] });
}));

// POST /brands (create)
app.post('/brands', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('brands').insert({ ...req.body, is_active: true });
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /brands/:id (update)
app.patch('/brands/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('brands').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /brands/:id
app.delete('/brands/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('brands').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /categories
app.get('/categories', requireServiceToken, wrap(async (req, res) => {
    const { data, count, error } = await supabase.from('categories')
        .select('*', { count: 'exact' }).order('name');
    if (error) throw new Error(error.message);
    res.json({ categories: data || [], totalCount: count || 0 });
}));

// GET /categories/:id/detail
app.get('/categories/:id/detail', requireServiceToken, wrap(async (req, res) => {
    const { id } = req.params;
    const [subsRes, linksRes] = await Promise.all([
        supabase.from('categories').select('*').eq('parent_id', id).order('name'),
        supabase.from('product_categories').select('product_id').eq('category_id', id),
    ]);
    if (subsRes.error) throw new Error(subsRes.error.message);
    if (linksRes.error) throw new Error(linksRes.error.message);

    let products: unknown[] = [];
    if (linksRes.data?.length) {
        const { data, error } = await supabase.from('products')
            .select('*').in('id', linksRes.data.map(l => l.product_id)).order('name');
        if (error) throw new Error(error.message);
        products = data || [];
    }
    res.json({ subcategories: subsRes.data || [], products });
}));

// POST /categories (create)
app.post('/categories', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('categories').insert({ ...req.body, is_active: true });
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// PATCH /categories/:id (update)
app.patch('/categories/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('categories').update(req.body).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /categories/:id
app.delete('/categories/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /suppliers
app.post('/suppliers', requireServiceToken, wrap(async (req, res) => {
    const formData = req.body as Record<string, unknown>;
    const slug = (formData.slug as string) ||
        (formData.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase.from('supplier')
        .insert([{ ...formData, slug, updated_at: new Date().toISOString() }]).select().single();
    if (error) { res.json({ success: false, error: error.message }); return; }
    res.json({ success: true, data });
}));

// DELETE /suppliers (bulk purge)
app.delete('/suppliers', requireServiceToken, wrap(async (req, res) => {
    await supabase.from('supplier_product_offer').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('procurement_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('supplier').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) { res.json({ success: false, error: error.message }); return; }
    res.json({ success: true });
}));

// DELETE /suppliers/:id
app.delete('/suppliers/:id', requireServiceToken, wrap(async (req, res) => {
    const { id } = req.params;
    const { error: offerErr } = await supabase.from('supplier_product_offer').delete().eq('supplier_id', id);
    if (offerErr) log.warn('Offer cleanup warning', { message: offerErr.message });

    const { error: orderErr } = await supabase.from('procurement_orders').delete().eq('supplier_id', id);
    if (orderErr) log.warn('Orders cleanup warning', { message: orderErr.message });

    const { error } = await supabase.from('supplier').delete().eq('id', id);
    if (error) { res.json({ success: false, error: error.message }); return; }
    res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE-INS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /trade-ins
app.post('/trade-ins', requireServiceToken, wrap(async (req, res) => {
    const { device_name, device_brand, device_model, condition, quoted_value, customer_name, customer_phone, notes } =
        req.body as Record<string, string | number | undefined>;

    const { data, error } = await supabase.from('trade_ins').insert({
        device_name, device_brand: device_brand || null, device_model: device_model || null,
        condition, quoted_value: quoted_value || null, customer_name: customer_name || null,
        customer_phone: customer_phone || null, notes: notes || null, status: 'pending',
    }).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
}));

// PATCH /trade-ins/:id/status
app.patch('/trade-ins/:id/status', requireServiceToken, wrap(async (req, res) => {
    const { status, finalValue } = req.body as { status: string; finalValue?: number };
    const { error } = await supabase.from('trade_ins')
        .update({ status, final_value: finalValue ?? null, updated_at: new Date().toISOString() })
        .eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// DELETE /trade-ins/:id
app.delete('/trade-ins/:id', requireServiceToken, wrap(async (req, res) => {
    const { error } = await supabase.from('trade_ins').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
}));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'catalog-service' }));

app.listen(PORT, () => log.info(`catalog-service listening on :${PORT}`));
