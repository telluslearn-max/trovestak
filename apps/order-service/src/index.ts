import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { PubSub } from '@google-cloud/pubsub';
import {
    createLogger,
    TOPICS,
    createEvent,
    publishEvent,
    createSupabaseAdminClient,
    normalizePhone,
    PaymentConfirmedEvent,
    PaymentFailedEvent,
} from '@trovestak/shared';

const log = createLogger('order-service');
const PORT = parseInt(process.env.PORT || '8082');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SERVICE_SECRET = process.env.SERVICE_SECRET || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    log.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
}

const supabase = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(express.json());

// ── Auth middleware for admin routes ──────────────────────────────────────────
function requireServiceToken(req: Request, res: Response, next: NextFunction) {
    if (!SERVICE_SECRET) { next(); return; } // No secret configured — open in dev
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_SECRET) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}

// ── PubSub setup ──────────────────────────────────────────────────────────────
const canUsePubSub = !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.NODE_ENV === 'production');
let pubsub: PubSub | null = null;

if (canUsePubSub) {
    try {
        pubsub = new PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
        startPaymentSubscribers();
    } catch (e) {
        log.warn('PubSub init failed — payment status updates via callback only');
    }
}

function startPaymentSubscribers() {
    if (!pubsub) return;

    const confirmedSub = process.env.PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED;
    const failedSub = process.env.PUBSUB_SUBSCRIPTION_PAYMENT_FAILED;

    if (confirmedSub) {
        pubsub.subscription(confirmedSub).on('message', async (msg) => {
            try {
                const event: PaymentConfirmedEvent = JSON.parse(msg.data.toString());
                await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', event.data.order_id);
                log.info('Payment confirmed — order updated', { order_id: event.data.order_id });
                msg.ack();
            } catch (e) { log.error('payment.confirmed handler error', { e }); msg.nack(); }
        });
        log.info(`Subscribed to ${confirmedSub}`);
    }

    if (failedSub) {
        pubsub.subscription(failedSub).on('message', async (msg) => {
            try {
                const event: PaymentFailedEvent = JSON.parse(msg.data.toString());
                await supabase.from('orders').update({ payment_status: 'failed', status: 'cancelled' }).eq('id', event.data.order_id);
                log.info('Payment failed — order cancelled', { order_id: event.data.order_id });
                msg.ack();
            } catch (e) { log.error('payment.failed handler error', { e }); msg.nack(); }
        });
        log.info(`Subscribed to ${failedSub}`);
    }
}

// ── Helper: publish + dev HTTP fallback ───────────────────────────────────────
async function publishOrFallback(topic: string, event: object, devFallbackUrl?: string) {
    await publishEvent(topic, event);
    if (process.env.NODE_ENV === 'development' && devFallbackUrl) {
        fetch(devFallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        }).catch(e => log.warn('Dev fallback failed', { url: devFallbackUrl, error: e.message }));
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// CHECKOUT ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// POST /orders — create M-Pesa order
app.post('/orders', async (req: Request, res: Response) => {
    const { phone, amount, orderData } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) { res.status(400).json({ error: 'Invalid phone number' }); return; }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: `${orderData.firstName} ${orderData.lastName}`.trim(),
            customer_email: orderData.email,
            customer_phone: normalizedPhone,
            shipping_address: {
                address: orderData.address,
                city: orderData.city,
                county: orderData.county,
                postal_code: orderData.postalCode,
            },
            subtotal: orderData.subtotal,
            discount_amount: orderData.discountAmount || 0,
            vat_amount: orderData.vatAmount || 0,
            total_amount: Math.ceil(amount),
            payment_method: 'mpesa',
            status: 'pending',
            mpesa_phone: normalizedPhone,
        })
        .select('id')
        .single();

    if (orderError || !order) {
        log.error('Order creation failed', { error: orderError });
        res.status(500).json({ error: 'Failed to create order' });
        return;
    }

    const orderId = order.id;

    if (orderData.items?.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
            order_id: orderId,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) log.error('Order items insert failed', { error: itemsError });
    }

    try {
        await publishEvent(TOPICS.ORDER_CREATED, createEvent(TOPICS.ORDER_CREATED, 'order-service', {
            order_id: orderId,
            customer_name: `${orderData.firstName} ${orderData.lastName}`.trim(),
            email: orderData.email,
            total_amount: Math.ceil(amount),
            items: orderData.items,
            shipping_address: {
                first_name: orderData.firstName,
                last_name: orderData.lastName,
                county: orderData.county,
            },
        }));

        const paymentEvent = createEvent(TOPICS.PAYMENT_INITIATE, 'order-service', {
            order_id: orderId,
            mpesa_phone: normalizedPhone,
            amount_kes: Math.ceil(amount),
            currency: 'KES',
        });
        const mpesaUrl = process.env.MPESA_SERVICE_URL || 'http://localhost:8081';
        await publishOrFallback(TOPICS.PAYMENT_INITIATE, paymentEvent, `${mpesaUrl}/local/payment-initiate`);

        res.json({ success: true, orderId });
    } catch (err: any) {
        log.error('PubSub error after order creation', { error: err.message });
        res.status(202).json({ error: 'Payment request queued but failed to transmit. Check your order status shortly.' });
    }
});

// POST /orders/manual — create manual till / COD order
app.post('/orders/manual', async (req: Request, res: Response) => {
    const { amount, orderData, paymentMethod, transactionCode } = req.body;

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: `${orderData.firstName} ${orderData.lastName}`.trim(),
            customer_email: orderData.email,
            customer_phone: orderData.phone,
            shipping_address: {
                address: orderData.address,
                city: orderData.city,
                county: orderData.county,
                postal_code: orderData.postalCode,
            },
            subtotal: orderData.subtotal,
            discount_amount: orderData.discountAmount || 0,
            vat_amount: orderData.vatAmount || 0,
            total_amount: Math.ceil(amount),
            payment_method: paymentMethod,
            status: 'pending_verification',
            mpesa_receipt_number: transactionCode || null,
        })
        .select('id')
        .single();

    if (orderError || !order) {
        log.error('Manual order creation failed', { error: orderError });
        res.status(500).json({ error: 'Failed to create order' });
        return;
    }

    const orderId = order.id;

    if (orderData.items?.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
            order_id: orderId,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
        }));
        await supabase.from('order_items').insert(orderItems);
    }

    try {
        await publishEvent(TOPICS.ORDER_CREATED, createEvent(TOPICS.ORDER_CREATED, 'order-service', {
            order_id: orderId,
            customer_name: `${orderData.firstName} ${orderData.lastName}`.trim(),
            email: orderData.email,
            total_amount: Math.ceil(amount),
            items: orderData.items,
            shipping_address: {
                first_name: orderData.firstName,
                last_name: orderData.lastName,
                county: orderData.county,
            },
        }));
    } catch (err: any) {
        log.warn('ORDER_CREATED publish failed (non-fatal for manual order)', { error: err.message });
    }

    res.json({ success: true, orderId });
});

// GET /orders/:id/status — payment status polling
app.get('/orders/:id/status', async (req: Request, res: Response) => {
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, payment_status, mpesa_receipt_number, created_at')
        .eq('id', req.params.id)
        .single();

    if (error || !order) { res.status(404).json({ status: 'not_found' }); return; }

    const age = Date.now() - new Date(order.created_at).getTime();
    if (order.status === 'processing' && order.payment_status !== 'paid' && age > 3 * 60 * 1000) {
        res.json({ status: 'timeout', orderId: order.id });
        return;
    }

    const statusMap: Record<string, string> = {
        pending: 'pending',
        processing: order.payment_status === 'paid' ? 'paid' : 'pending',
        paid: 'paid',
        cancelled: 'failed',
    };

    res.json({
        status: statusMap[order.status] || 'pending',
        orderId: order.id,
        receiptNumber: order.mpesa_receipt_number || null,
    });
});

// POST /cart/validate — stock + price drift validation
app.post('/cart/validate', async (req: Request, res: Response) => {
    const { items } = req.body;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!Array.isArray(items) || items.length === 0) {
        res.json({ valid: false, items: [], warnings: [], errors: ['Cart is empty'] });
        return;
    }

    const result: {
        valid: boolean;
        items: any[];
        warnings: string[];
        errors: string[];
    } = { valid: true, items: [], warnings: [], errors: [] };

    for (const item of items) {
        if (!UUID_RE.test(item.product_id)) {
            result.errors.push(`Invalid product ID: ${item.product_id}`);
            result.valid = false;
            continue;
        }

        let currentPrice = 0;
        let availableStock = 0;
        let stockStatus = 'instock';

        if (item.variant_id && UUID_RE.test(item.variant_id)) {
            const { data: variant } = await supabase
                .from('product_variants')
                .select('id, price_kes, stock_quantity')
                .eq('id', item.variant_id)
                .single();

            if (!variant) {
                result.items.push({ ...item, status: 'removed', currentPrice: 0, availableStock: 0, message: `"${item.title}" is no longer available` });
                result.errors.push(`"${item.title}" has been removed from the catalog`);
                result.valid = false;
                continue;
            }
            currentPrice = variant.price_kes ?? 0;
            availableStock = (variant.stock_quantity ?? 0) as number;
            stockStatus = availableStock > 0 ? 'instock' : 'outofstock';
        } else {
            const { data: product } = await supabase
                .from('products')
                .select('id, status')
                .eq('id', item.product_id)
                .single();

            if (!product || product.status !== 'published') {
                result.items.push({ ...item, status: 'removed', currentPrice: 0, availableStock: 0, message: `"${item.title}" is no longer available` });
                result.errors.push(`"${item.title}" is unavailable`);
                result.valid = false;
                continue;
            }

            const { data: pricing } = await supabase
                .from('product_pricing')
                .select('sell_price')
                .eq('product_id', item.product_id)
                .maybeSingle();

            currentPrice = pricing?.sell_price ?? 0;
            availableStock = 999;
            stockStatus = currentPrice > 0 ? 'instock' : 'outofstock';
        }

        if (stockStatus === 'outofstock' || availableStock <= 0) {
            result.items.push({ ...item, status: 'out_of_stock', currentPrice, availableStock: 0, message: `"${item.title}" is out of stock` });
            result.errors.push(`"${item.title}" is out of stock`);
            result.valid = false;
            continue;
        }

        if (item.quantity > availableStock) {
            result.items.push({ ...item, quantity: availableStock, status: 'low_stock', currentPrice, availableStock, message: `Only ${availableStock} units of "${item.title}" available` });
            result.warnings.push(`Quantity for "${item.title}" reduced to ${availableStock}`);
            result.valid = false;
            continue;
        }

        const TOLERANCE = 100;
        if (Math.abs(currentPrice - item.unit_price) > TOLERANCE) {
            result.items.push({ ...item, unit_price: currentPrice, status: 'price_changed', currentPrice, availableStock, message: `Price for "${item.title}" has changed` });
            result.warnings.push(`Price for "${item.title}" updated from ${item.unit_price} to ${currentPrice}`);
            result.valid = false;
            continue;
        }

        result.items.push({ ...item, status: 'ok', currentPrice, availableStock });
    }

    res.json(result);
});

// GET /shipping/rate/:county — shipping rate lookup
app.get('/shipping/rate/:county', async (req: Request, res: Response) => {
    const countyName = req.params.county;

    const { data: zones } = await supabase
        .from('shipping_zones')
        .select('id')
        .contains('counties', [countyName])
        .limit(1);

    if (!zones || zones.length === 0) { res.json({ rate: 1500 }); return; }

    const { data: rates } = await supabase
        .from('shipping_rates')
        .select('rate_amount')
        .eq('zone_id', zones[0].id)
        .order('rate_amount', { ascending: true })
        .limit(1);

    res.json({ rate: rates?.[0]?.rate_amount ?? 1500 });
});

// GET /discount/:code — discount code validation
app.get('/discount/:code', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('discount_codes')
        .select('code, type, value')
        .eq('code', req.params.code.toUpperCase())
        .gt('ends_at', new Date().toISOString())
        .eq('is_active', true)
        .single();

    if (error || !data) { res.status(404).json({ error: 'Invalid or expired discount code' }); return; }
    res.json({ success: true, discount: data });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES (require X-Service-Token)
// ═════════════════════════════════════════════════════════════════════════════

// GET /orders — list all orders
app.get('/orders', requireServiceToken, async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:user_id (full_name, email)')
        .order('created_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
});

// PATCH /orders/:id/status — update order status
app.patch('/orders/:id/status', requireServiceToken, async (req: Request, res: Response) => {
    const { status } = req.body;
    const { error } = await supabase.from('orders').update({ status }).eq('id', req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }

    try {
        await publishEvent(TOPICS.ORDER_UPDATED, createEvent(TOPICS.ORDER_UPDATED, 'order-service', {
            order_id: req.params.id,
            status,
            updated_at: new Date().toISOString(),
        }));
    } catch (e) { /* non-fatal */ }

    res.json({ success: true });
});

// GET /orders/fulfillment-queue — paid orders in processing/packing
app.get('/orders/fulfillment-queue', requireServiceToken, async (req: Request, res: Response) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id, customer_name, customer_phone, status, payment_status,
            payment_method, shipping_address, total_amount,
            rider_name, dispatched_at, created_at,
            profiles:user_id ( full_name, email )
        `)
        .eq('payment_status', 'paid')
        .in('status', ['processing', 'packing'])
        .order('created_at', { ascending: true });

    if (error) { res.status(500).json({ error: error.message }); return; }

    const orderIds = (orders || []).map((o: any) => o.id);
    if (orderIds.length === 0) { res.json([]); return; }

    const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
            id, order_id, quantity, unit_price, total_price,
            product_variants:variant_id ( sku, color, storage,
                products:product_id ( name )
            )
        `)
        .in('order_id', orderIds);

    const itemsByOrder: Record<string, any[]> = {};
    for (const item of (itemsData || []) as any[]) {
        const variant = item.product_variants;
        const label = [variant?.color, variant?.storage].filter(Boolean).join(' / ');
        const entry = {
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product_name: variant?.products?.name ?? null,
            variant_label: label || null,
        };
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(entry);
    }

    const result = (orders || []).map((o: any) => ({
        id: o.id,
        customer_name: o.customer_name || o.profiles?.full_name || null,
        customer_email: o.profiles?.email || null,
        customer_phone: o.customer_phone || null,
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        shipping_address: o.shipping_address,
        total_amount: o.total_amount,
        rider_name: o.rider_name,
        dispatched_at: o.dispatched_at,
        created_at: o.created_at,
        items: itemsByOrder[o.id] || [],
    }));

    res.json(result);
});

// POST /orders/:id/assign-rider
app.post('/orders/:id/assign-rider', requireServiceToken, async (req: Request, res: Response) => {
    const { riderName } = req.body;
    const { error } = await supabase
        .from('orders')
        .update({ rider_name: riderName, status: 'packing' })
        .eq('id', req.params.id);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
});

// POST /orders/:id/dispatch
app.post('/orders/:id/dispatch', requireServiceToken, async (req: Request, res: Response) => {
    const dispatchedAt = new Date().toISOString();

    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: 'shipped', dispatched_at: dispatchedAt })
        .eq('id', req.params.id)
        .select('id, customer_name, customer_phone, rider_name, total_amount, shipping_address')
        .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    try {
        await publishEvent(TOPICS.ORDER_DISPATCHED, createEvent(TOPICS.ORDER_DISPATCHED, 'order-service', {
            order_id: req.params.id,
            customer_name: order?.customer_name ?? null,
            customer_phone: order?.customer_phone ?? null,
            rider_name: order?.rider_name ?? null,
            total_amount: order?.total_amount ?? 0,
            shipping_address: order?.shipping_address ?? null,
            dispatched_at: dispatchedAt,
        }));
    } catch (e) { /* non-fatal */ }

    res.json({ success: true, dispatched_at: dispatchedAt });
});

// GET /riders — active riders
app.get('/riders', requireServiceToken, async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('riders')
        .select('id, name, phone, zone, is_active')
        .eq('is_active', true)
        .order('name');

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
});

// POST /orders/print — print slip data
app.post('/orders/print', requireServiceToken, async (req: Request, res: Response) => {
    const { orderIds } = req.body;
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, customer_name, customer_phone, total_amount,
            shipping_address, rider_name, created_at,
            profiles:user_id ( full_name, email ),
            order_items (
                quantity, unit_price, total_price,
                product_variants:variant_id ( sku, color, storage,
                    products:product_id ( name )
                )
            )
        `)
        .in('id', orderIds);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.listen(PORT, () => log.info(`order-service listening on port ${PORT}`));

process.on('SIGTERM', () => { log.info('Shutting down'); process.exit(0); });
process.on('SIGINT', () => { log.info('Shutting down'); process.exit(0); });
