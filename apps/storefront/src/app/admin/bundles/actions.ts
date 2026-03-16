'use server';

import { revalidatePath } from 'next/cache';
import { logAdminActivity } from '@/lib/admin/activity';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

export type BundleType = 'fixed' | 'configurable';
export type BundleStatus = 'draft' | 'active' | 'archived';

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

export async function getBundles() {
    return callCatalog('/bundles');
}

export async function createBundle(data: {
    name: string; slug: string; description?: string; bundle_type: BundleType;
    status?: BundleStatus; price_override?: number; discount_type?: string; discount_value?: number;
}) {
    const bundle = await callCatalog('/bundles', { method: 'POST', body: JSON.stringify(data) });
    await logAdminActivity({ action: 'CREATE_BUNDLE', resource: 'bundles', resourceId: bundle.id, metadata: { name: bundle.name, type: bundle.bundle_type } });
    revalidatePath('/admin/bundles');
    return bundle;
}

export async function updateBundle(id: string, data: Partial<{
    name: string; slug: string; description: string; status: BundleStatus;
    price_override: number; discount_type: string; discount_value: number;
}>) {
    await callCatalog(`/bundles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await logAdminActivity({ action: 'UPDATE_BUNDLE', resource: 'bundles', resourceId: id, metadata: data });
    revalidatePath('/admin/bundles');
}

export async function deleteBundle(id: string) {
    await callCatalog(`/bundles/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_BUNDLE', resource: 'bundles', resourceId: id });
    revalidatePath('/admin/bundles');
}

export async function addBundleItem(bundleId: string, variantId: string, quantity: number = 1) {
    await callCatalog(`/bundles/${bundleId}/items`, { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
    revalidatePath('/admin/bundles');
}

export async function removeBundleItem(itemId: string) {
    await callCatalog(`/bundle-items/${itemId}`, { method: 'DELETE' });
    revalidatePath('/admin/bundles');
}

export async function addBundleSlot(bundleId: string, slotName: string, required: boolean = true) {
    const data = await callCatalog(`/bundles/${bundleId}/slots`, { method: 'POST', body: JSON.stringify({ slotName, required }) });
    revalidatePath('/admin/bundles');
    return data;
}

export async function deleteBundleSlot(slotId: string) {
    await callCatalog(`/bundle-slots/${slotId}`, { method: 'DELETE' });
    revalidatePath('/admin/bundles');
}

export async function addSlotOption(slotId: string, variantId: string, priceModifier: number = 0) {
    await callCatalog(`/bundle-slots/${slotId}/options`, { method: 'POST', body: JSON.stringify({ variantId, priceModifier }) });
    revalidatePath('/admin/bundles');
}

export async function removeSlotOption(optionId: string) {
    await callCatalog(`/bundle-slot-options/${optionId}`, { method: 'DELETE' });
    revalidatePath('/admin/bundles');
}

export async function searchVariants(query: string) {
    return callCatalog(`/variants/search?q=${encodeURIComponent(query)}`);
}

export async function getBundlesForProduct(productId: string) {
    return callCatalog(`/bundles/product/${productId}`);
}
