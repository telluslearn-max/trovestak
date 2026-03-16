'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/admin/guard';

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

export async function createTradeInAction(formData: {
    device_name: string; device_brand?: string; device_model?: string;
    condition: 'like_new' | 'good' | 'fair' | 'poor';
    quoted_value?: number; customer_name?: string; customer_phone?: string; notes?: string;
}) {
    await ensureAdmin('editor');
    const result = await callCatalog('/trade-ins', { method: 'POST', body: JSON.stringify(formData) });
    revalidatePath('/admin/inventory/trade-ins');
    return result;
}

export async function updateTradeInStatusAction(id: string, status: string, finalValue?: number) {
    await ensureAdmin('editor');
    await callCatalog(`/trade-ins/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, finalValue }) });
    revalidatePath('/admin/inventory/trade-ins');
}

export async function deleteTradeInAction(id: string) {
    await ensureAdmin('manager');
    await callCatalog(`/trade-ins/${id}`, { method: 'DELETE' });
    revalidatePath('/admin/inventory/trade-ins');
}
