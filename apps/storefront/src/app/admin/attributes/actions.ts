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

// ─── Attributes CRUD ─────────────────────────────────────────

export async function getAttributes() {
    return callCatalog('/attributes');
}

export async function createAttribute(formData: {
    name: string; slug: string; display_type: string; filterable: boolean;
}) {
    const data = await callCatalog('/attributes', { method: 'POST', body: JSON.stringify(formData) });
    await logAdminActivity({ action: 'CREATE_ATTRIBUTE', resource: 'attributes', resourceId: data.id, metadata: { name: formData.name } });
    revalidatePath('/admin/attributes');
    return data;
}

export async function updateAttribute(
    id: string,
    updates: { name?: string; slug?: string; display_type?: string; filterable?: boolean }
) {
    await callCatalog(`/attributes/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    await logAdminActivity({ action: 'UPDATE_ATTRIBUTE', resource: 'attributes', resourceId: id, metadata: updates });
    revalidatePath('/admin/attributes');
}

export async function deleteAttribute(id: string) {
    await callCatalog(`/attributes/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_ATTRIBUTE', resource: 'attributes', resourceId: id });
    revalidatePath('/admin/attributes');
}

// ─── Attribute Values CRUD ─────────────────────────────────────

export async function createAttributeValue(data: {
    attribute_id: string; value: string; hex_color?: string; sort_order?: number;
}) {
    const inserted = await callCatalog('/attribute-values', { method: 'POST', body: JSON.stringify(data) });
    await logAdminActivity({ action: 'CREATE_ATTRIBUTE_VALUE', resource: 'attribute_values', resourceId: inserted.id, metadata: data });
    revalidatePath('/admin/attributes');
    return inserted;
}

export async function updateAttributeValue(
    id: string,
    updates: { value?: string; hex_color?: string; sort_order?: number }
) {
    await callCatalog(`/attribute-values/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    revalidatePath('/admin/attributes');
}

export async function deleteAttributeValue(id: string) {
    await callCatalog(`/attribute-values/${id}`, { method: 'DELETE' });
    revalidatePath('/admin/attributes');
}

// ─── Templates CRUD ─────────────────────────────────────────

export async function getTemplates() {
    return callCatalog('/templates');
}

export async function createTemplate(formData: { name: string; slug: string; attribute_ids: string[] }) {
    const tmpl = await callCatalog('/templates', { method: 'POST', body: JSON.stringify(formData) });
    await logAdminActivity({ action: 'CREATE_TEMPLATE', resource: 'variant_templates', resourceId: tmpl.id, metadata: { name: formData.name } });
    revalidatePath('/admin/attributes');
    return tmpl;
}

export async function updateTemplateAttributes(templateId: string, attribute_ids: string[]) {
    await callCatalog(`/templates/${templateId}/attributes`, { method: 'PUT', body: JSON.stringify({ attribute_ids }) });
    revalidatePath('/admin/attributes');
}

export async function deleteTemplate(id: string) {
    await callCatalog(`/templates/${id}`, { method: 'DELETE' });
    await logAdminActivity({ action: 'DELETE_TEMPLATE', resource: 'variant_templates', resourceId: id });
    revalidatePath('/admin/attributes');
}
