'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/admin/guard';
import { logAdminActivity } from '@/lib/admin/activity';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8082';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

function serviceHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-service-token': SERVICE_SECRET,
    };
}

async function callOrderService(path: string, options: RequestInit = {}) {
    const res = await fetch(`${ORDER_SERVICE_URL}${path}`, {
        ...options,
        headers: { ...serviceHeaders(), ...(options.headers as object) },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export interface FulfillmentOrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string | null;
    variant_label: string | null;
}

export interface FulfillmentOrder {
    id: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    status: string;
    payment_status: string;
    payment_method: string | null;
    shipping_address: Record<string, string> | null;
    total_amount: number;
    rider_name: string | null;
    dispatched_at: string | null;
    created_at: string;
    items: FulfillmentOrderItem[];
}

export interface Rider {
    id: string;
    name: string;
    phone: string;
    zone: string | null;
    is_active: boolean;
}

export async function getFulfillmentQueue() {
    await ensureAdmin('support');
    return callOrderService('/orders/fulfillment-queue');
}

export async function assignRiderAction(orderId: string, riderName: string) {
    await ensureAdmin('editor');

    await callOrderService(`/orders/${orderId}/assign-rider`, {
        method: 'POST',
        body: JSON.stringify({ riderName }),
    });

    await logAdminActivity({
        action: 'ASSIGN_RIDER',
        resource: 'orders',
        resourceId: orderId,
        metadata: { rider_name: riderName },
    });

    revalidatePath('/admin/orders/fulfillment');
}

export async function markDispatchedAction(orderId: string) {
    await ensureAdmin('editor');

    const result = await callOrderService(`/orders/${orderId}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({}),
    });

    await logAdminActivity({
        action: 'MARK_DISPATCHED',
        resource: 'orders',
        resourceId: orderId,
        metadata: { dispatched_at: result.dispatched_at },
    });

    revalidatePath('/admin/orders/fulfillment');
}

export async function getRidersAction() {
    await ensureAdmin('support');
    return callOrderService('/riders');
}

export async function getPrintDataAction(orderIds: string[]) {
    await ensureAdmin('support');
    return callOrderService('/orders/print', {
        method: 'POST',
        body: JSON.stringify({ orderIds }),
    });
}
