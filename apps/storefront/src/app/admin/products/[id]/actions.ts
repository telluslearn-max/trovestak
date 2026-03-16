'use server';

import { revalidatePath } from 'next/cache';
import { logAdminActivity } from '@/lib/admin/activity';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

function serviceHeaders() {
    return { 'Content-Type': 'application/json', 'x-service-token': SERVICE_SECRET };
}

async function callCatalog(path: string, options: RequestInit = {}) {
    const res = await fetch(`${CATALOG_SERVICE_URL}${path}`, {
        ...options,
        headers: { ...serviceHeaders(), ...(options.headers as object || {}) },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateProduct(id: string, productData: Record<string, unknown>) {
    await callCatalog('/products', {
        method: 'POST',
        body: JSON.stringify({ id, payload: {
            name: productData.name, description: productData.description,
            seo_title: productData.seo_title, seo_description: productData.seo_description,
            is_active: productData.is_active,
        }}),
    });

    await logAdminActivity({ action: 'UPDATE_PRODUCT', resource: 'products', resourceId: id, metadata: { name: productData.name as string } });

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    if (productData.slug) revalidatePath(`/products/${productData.slug}`, 'page');

    return { success: true };
}

export async function updateVariantPrice(formData: FormData) {
    const variantId = formData.get('variant_id') as string;
    const productId = formData.get('product_id') as string;
    const priceRaw = formData.get('price_kes') as string;

    if (!variantId || !productId) return;

    await callCatalog(`/variants/${variantId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ priceRaw }),
    });

    const price_kes = priceRaw && priceRaw.trim() !== '' ? Math.round(parseFloat(priceRaw) * 100) : null;
    await logAdminActivity({ action: 'UPDATE_VARIANT_PRICE', resource: 'product_variants', resourceId: variantId, metadata: { productId, price_kes } });

    revalidatePath(`/admin/products/${productId}`);
}

export async function updateProductGallery(id: string, galleryUrls: string[]) {
    await callCatalog(`/products/${id}/gallery`, {
        method: 'PATCH',
        body: JSON.stringify({ galleryUrls }),
    });

    await logAdminActivity({ action: 'UPDATE_PRODUCT', resource: 'products', resourceId: id, metadata: { galleryUpdated: true } });

    revalidatePath(`/admin/products/${id}`);
    return { success: true };
}

export async function updateVariantCostPrice(variantId: string, productId: string, costPrice: number) {
    await callCatalog(`/variants/${variantId}/cost`, {
        method: 'PATCH',
        body: JSON.stringify({ costPrice }),
    });

    await logAdminActivity({ action: 'UPDATE_VARIANT_COST', resource: 'product_variants', resourceId: variantId, metadata: { productId, costPrice } });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
}

export async function updateRelatedProducts(productId: string, relatedProductIds: string[]) {
    await callCatalog(`/products/${productId}/relations`, {
        method: 'PUT',
        body: JSON.stringify({ relatedProductIds }),
    });

    await logAdminActivity({ action: 'UPDATE_PRODUCT_RELATIONS', resource: 'products', resourceId: productId, metadata: { relatedCount: relatedProductIds.length } });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
}

export async function searchProducts(query: string, excludeId: string) {
    const result = await callCatalog(`/products/search?q=${encodeURIComponent(query)}&exclude=${excludeId}`);
    return result;
}
