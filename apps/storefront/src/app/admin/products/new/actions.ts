'use server';

import { revalidatePath } from 'next/cache';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

function serviceHeaders() {
    return { 'Content-Type': 'application/json', 'x-service-token': SERVICE_SECRET };
}

export async function createProductAction(formData: FormData) {
    const payload: Record<string, string | null> = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        image_url: formData.get('image_url') as string,
        category_id: formData.get('category_id') as string || null,
        brand_type: formData.get('brand_type') as string,
        nav_category: formData.get('nav_category') as string,
        nav_subcategory: formData.get('nav_subcategory') as string,
        content_overview: formData.get('content_overview') as string,
        variants_json: formData.get('variants_json') as string,
        specs_json: formData.get('specs_json') as string,
        features_json: formData.get('features_json') as string | null,
        qa_json: formData.get('qa_json') as string | null,
        colors_json: formData.get('colors_json') as string | null,
        addons_json: formData.get('addons_json') as string | null,
        trade_in_json: formData.get('trade_in_json') as string | null,
        badge: formData.get('badge') as string | null,
        compare_price: formData.get('compare_price') as string | null,
        warranty: formData.get('warranty') as string | null,
        availability: formData.get('availability') as string | null,
    };

    const res = await fetch(`${CATALOG_SERVICE_URL}/products/create`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!result.success) return result;

    revalidatePath('/admin/products');
    revalidatePath('/store', 'page');
    if (result.slug) revalidatePath(`/products/${result.slug}`, 'page');

    return result;
}
