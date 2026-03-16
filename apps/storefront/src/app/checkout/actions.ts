'use server';

import { headers } from 'next/headers';
import { paymentLimiter } from '@/lib/rate-limit';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8082';

async function callOrderService(path: string, options: RequestInit = {}) {
    const res = await fetch(`${ORDER_SERVICE_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    return res.json();
}

export async function validateDiscountAction(code: string) {
    return callOrderService(`/discount/${encodeURIComponent(code)}`);
}

export async function getShippingRateAction(countyName: string) {
    return callOrderService(`/shipping/rate/${encodeURIComponent(countyName)}`);
}

export async function validateCartAction(items: unknown[]) {
    return callOrderService('/cart/validate', {
        method: 'POST',
        body: JSON.stringify({ items }),
    });
}

export async function initiateMpesaStkAction(phone: string, amount: number, orderData: unknown) {
    const h = await headers();
    const ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'unknown';

    const rl = paymentLimiter.check(ip);
    if (!rl.success) return { error: 'Too many requests. Please wait.' };

    return callOrderService('/orders', {
        method: 'POST',
        body: JSON.stringify({ phone, amount, orderData }),
    });
}

export async function getMpesaStatusAction(orderId: string) {
    return callOrderService(`/orders/${orderId}/status`);
}

export async function createManualOrderAction(
    amount: number,
    orderData: unknown,
    paymentMethod: 'manual_till' | 'cod',
    transactionCode?: string
) {
    return callOrderService('/orders/manual', {
        method: 'POST',
        body: JSON.stringify({ amount, orderData, paymentMethod, transactionCode }),
    });
}
