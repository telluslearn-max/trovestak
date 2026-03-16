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

export async function getOrders() {
    await ensureAdmin('support');
    const res = await fetch(`${ORDER_SERVICE_URL}/orders`, { headers: serviceHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
    await ensureAdmin('editor');

    const res = await fetch(`${ORDER_SERVICE_URL}/orders/${id}/status`, {
        method: 'PATCH',
        headers: serviceHeaders(),
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await res.text());

    await logAdminActivity({
        action: 'UPDATE_ORDER_STATUS',
        resource: 'orders',
        resourceId: id,
        metadata: { status },
    });

    revalidatePath('/admin/orders');
}
