'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/admin/guard';
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

export async function bulkUpdateCategory(productIds: string[], categoryId: string) {
    await ensureAdmin('editor');
    await callCatalog('/products/bulk/category', {
        method: 'POST',
        body: JSON.stringify({ productIds, categoryId }),
    });
    await logAdminActivity({ action: 'BULK_UPDATE_CATEGORY', resource: 'products', resourceId: 'multiple', metadata: { productIds, categoryId } });
    revalidatePath('/admin/products');
    return { success: true };
}

export async function bulkUpdatePrices(
    productIds: string[],
    type: 'percentage' | 'fixed',
    value: number,
    direction: 'increase' | 'decrease'
) {
    await ensureAdmin('editor');
    const result = await callCatalog('/products/bulk/prices', {
        method: 'POST',
        body: JSON.stringify({ productIds, type, value, direction }),
    });
    await logAdminActivity({ action: 'BULK_UPDATE_PRICES', resource: 'products', resourceId: 'multiple', metadata: { type, value, direction, productCount: productIds.length } });
    revalidatePath('/admin/products');
    return result;
}

export async function bulkDeleteProducts(productIds: string[]) {
    await ensureAdmin('manager');
    await callCatalog('/products/bulk/delete', { method: 'POST', body: JSON.stringify({ productIds }) });
    await logAdminActivity({ action: 'BULK_DELETE_PRODUCTS', resource: 'products', resourceId: 'multiple', metadata: { productIds } });
    revalidatePath('/admin/products');
    return { success: true };
}

export async function bulkToggleStatus(productIds: string[], active: boolean) {
    await ensureAdmin('editor');
    await callCatalog('/products/bulk/toggle', { method: 'POST', body: JSON.stringify({ productIds, active }) });
    await logAdminActivity({ action: 'BULK_TOGGLE_STATUS', resource: 'products', resourceId: 'multiple', metadata: { productIds, active } });
    revalidatePath('/admin/products');
    return { success: true };
}

export async function bulkUpsertProducts(productsData: unknown[]) {
    await ensureAdmin('editor');
    const result = await callCatalog('/products/bulk/upsert', { method: 'POST', body: JSON.stringify({ productsData }) });
    await logAdminActivity({ action: 'BULK_IMPORT_PRODUCTS', resource: 'products', resourceId: 'multiple', metadata: { count: result.count } });
    revalidatePath('/admin/products');
    return result;
}

export async function updateProductPrice(variantId: string, priceKes: number) {
    await ensureAdmin('editor');
    await callCatalog(`/variants/${variantId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ priceRaw: String(priceKes) }),
    });
    await logAdminActivity({ action: 'UPDATE_VARIANT_PRICE', resource: 'product_variants', resourceId: variantId, metadata: { price: priceKes } });
    revalidatePath('/admin/products');
    return { success: true };
}

export async function getProductsAdminList() {
    await ensureAdmin('support');
    return callCatalog('/products/list');
}

export async function deleteProduct(id: string) {
    await ensureAdmin('manager');
    await callCatalog(`/products/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_PRODUCT', resource: 'products', resourceId: id });
    revalidatePath('/admin/products');
    return { success: true };
}

export async function getProductById(id: string) {
    await ensureAdmin('support');
    return callCatalog(`/products/${id}`);
}

export async function upsertProduct(id: string | null, payload: unknown, primaryCategoryId?: string) {
    await ensureAdmin('editor');
    const result = await callCatalog('/products', {
        method: 'POST',
        body: JSON.stringify({ id, payload, primaryCategoryId }),
    });
    await logAdminActivity({ action: id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', resource: 'products', resourceId: result.product?.id, metadata: { name: result.product?.name } });
    revalidatePath('/admin/products');
    if (id) revalidatePath(`/admin/products/${id}`);
    return result;
}

export async function searchProductsAdmin(query: string) {
    await ensureAdmin('support');
    const result = await callCatalog(`/products/search?q=${encodeURIComponent(query)}`);
    return result.data || [];
}

export async function getAttributeGroups() {
    await ensureAdmin('support');
    return callCatalog('/attribute-groups');
}

export async function upsertAttributeGroup(data: unknown, id?: string) {
    await ensureAdmin('editor');
    if (id) {
        await callCatalog(`/attribute-groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        await logAdminActivity({ action: 'UPDATE_ATTRIBUTE_GROUP', resource: 'product_attribute_groups', resourceId: id, metadata: { data } });
    } else {
        const newGroup = await callCatalog('/attribute-groups', { method: 'POST', body: JSON.stringify(data) });
        await logAdminActivity({ action: 'CREATE_ATTRIBUTE_GROUP', resource: 'product_attribute_groups', resourceId: newGroup.id, metadata: { data } });
        return newGroup;
    }
}

export async function deleteAttributeGroup(id: string) {
    await ensureAdmin('manager');
    await callCatalog(`/attribute-groups/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_ATTRIBUTE_GROUP', resource: 'product_attribute_groups', resourceId: id });
}

export async function upsertAttributeTerm(data: unknown, id?: string) {
    await ensureAdmin('editor');
    if (id) {
        await callCatalog(`/attribute-terms/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        await logAdminActivity({ action: 'UPDATE_ATTRIBUTE_TERM', resource: 'product_attribute_terms', resourceId: id, metadata: { data } });
    } else {
        const newTerm = await callCatalog('/attribute-terms', { method: 'POST', body: JSON.stringify(data) });
        await logAdminActivity({ action: 'CREATE_ATTRIBUTE_TERM', resource: 'product_attribute_terms', resourceId: newTerm.id, metadata: { data } });
        return newTerm;
    }
}

export async function deleteAttributeTerm(id: string) {
    await ensureAdmin('manager');
    await callCatalog(`/attribute-terms/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_ATTRIBUTE_TERM', resource: 'product_attribute_terms', resourceId: id });
}

export async function getProductsAdmin(params: {
    page?: number; limit?: number; query?: string; status?: string; activeOnly?: boolean;
}) {
    await ensureAdmin('support');
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.query) qs.set('query', params.query);
    if (params.status) qs.set('status', params.status);
    if (params.activeOnly !== undefined) qs.set('activeOnly', String(params.activeOnly));
    return callCatalog(`/products?${qs.toString()}`);
}

export async function getProductFullAdmin(id: string) {
    await ensureAdmin('support');
    return callCatalog(`/products/${id}/full`);
}

export async function addProductRelation(fromId: string, toId: string, type: string, strength: number = 1.0) {
    await ensureAdmin('editor');
    const result = await callCatalog(`/products/${fromId}/relations`, {
        method: 'POST',
        body: JSON.stringify({ toId, type, strength }),
    });
    await logAdminActivity({ action: 'ADD_PRODUCT_RELATION', resource: 'product_relation', resourceId: result.data?.id, metadata: { fromId, toId, type } });
    revalidatePath(`/admin/products/${fromId}`);
    return result;
}

export async function deleteProductRelation(id: string, fromId: string) {
    await ensureAdmin('editor');
    await callCatalog(`/relations/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_PRODUCT_RELATION', resource: 'product_relation', resourceId: id });
    revalidatePath(`/admin/products/${fromId}`);
    return { success: true };
}

export async function updateProductRelationStrength(id: string, fromId: string, strength: number) {
    await ensureAdmin('editor');
    await callCatalog(`/relations/${id}/strength`, { method: 'PATCH', body: JSON.stringify({ strength }) });
    await logAdminActivity({ action: 'UPDATE_PRODUCT_RELATION_STRENGTH', resource: 'product_relation', resourceId: id, metadata: { strength } });
    revalidatePath(`/admin/products/${fromId}`);
    return { success: true };
}
