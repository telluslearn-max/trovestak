'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/admin/guard';
import { logAdminActivity } from '@/lib/admin/activity';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

export interface DiscountCode {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description: string | null;
    is_active: boolean;
    usage_count: number;
    usage_limit: number | null;
    minimum_order_amount: number;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

export interface FlashSale {
    id: string;
    title: string;
    description: string | null;
    discount_percent: number;
    product_ids: string[];
    category_slugs: string[];
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    banner_color: string;
    created_at: string;
}

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

export async function getDiscountCodes(): Promise<DiscountCode[]> {
    await ensureAdmin('support');
    return callCatalog('/discounts');
}

export async function createDiscountCodeAction(input: {
    code: string; type: 'percentage' | 'fixed'; value: number;
    description?: string; usage_limit?: number; minimum_order_amount?: number; ends_at?: string;
}) {
    await ensureAdmin('editor');
    await callCatalog('/discounts', { method: 'POST', body: JSON.stringify(input) });
    await logAdminActivity({ action: 'CREATE_DISCOUNT', resource: 'discount_codes', resourceId: input.code, metadata: { code: input.code } });
    revalidatePath('/admin/marketing/promotions');
}

export async function toggleDiscountCodeAction(id: string, is_active: boolean) {
    await ensureAdmin('editor');
    await callCatalog(`/discounts/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
    revalidatePath('/admin/marketing/promotions');
}

export async function deleteDiscountCodeAction(id: string) {
    await ensureAdmin('manager');
    await callCatalog(`/discounts/${id}`, { method: 'DELETE' });
    revalidatePath('/admin/marketing/promotions');
}

export async function getFlashSales(): Promise<FlashSale[]> {
    await ensureAdmin('support');
    return callCatalog('/flash-sales');
}

export async function createFlashSaleAction(input: {
    title: string; description?: string; discount_percent: number;
    starts_at: string; ends_at: string; banner_color?: string;
}) {
    await ensureAdmin('editor');
    await callCatalog('/flash-sales', { method: 'POST', body: JSON.stringify(input) });
    await logAdminActivity({ action: 'CREATE_DISCOUNT', resource: 'flash_sales', resourceId: input.title, metadata: { title: input.title } });
    revalidatePath('/admin/marketing/flash-sales');
}

export async function toggleFlashSaleAction(id: string, is_active: boolean) {
    await ensureAdmin('editor');
    await callCatalog(`/flash-sales/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
    revalidatePath('/admin/marketing/flash-sales');
}
