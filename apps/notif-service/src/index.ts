import http from "http";
import "dotenv/config";
import { PubSub } from "@google-cloud/pubsub";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import africastalking from "africastalking";
import {
    createLogger,
    validateEnv,
    TOPICS,
    publishEvent,
    createEvent,
    OrderCreatedEvent,
    PaymentConfirmedEvent,
    StockLowEvent,
    normalizePhone,
} from "@trovestak/shared";

interface OrderDispatchedEvent {
    id: string;
    topic: string;
    timestamp: string;
    source: string;
    version: string;
    data: {
        order_id: string;
        customer_name: string | null;
        customer_phone: string | null;
        rider_name: string | null;
        total_amount: number;
        shipping_address: Record<string, string> | null;
        dispatched_at: string;
    };
}

/**
 * NOTIF SERVICE
 */

const log = createLogger("notif-service");

// 1. Validate environment
const env = validateEnv([
    "GOOGLE_CLOUD_PROJECT",
    "PUBSUB_SUBSCRIPTION_ORDER_CREATED",
    "PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED",
    "PUBSUB_SUBSCRIPTION_STOCK_LOW",
    "PUBSUB_SUBSCRIPTION_ORDER_DISPATCHED",
    "PUBSUB_SUBSCRIPTION_ORDER_UPDATED"
]);

const pubsub = new PubSub({ projectId: env.GOOGLE_CLOUD_PROJECT });

// Supabase admin client for scheduled job handlers
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// ── Resend email client ───────────────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Trovestak <noreply@trovestak.com>';

// ── Africa's Talking SMS client ───────────────────────────────────────────────
const atClient = (process.env.AT_API_KEY && process.env.AT_USERNAME)
    ? africastalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME })
    : null;
const AT_SENDER = process.env.AT_SENDER_ID || 'TROVESTAK';

async function sendSms(to: string | null, message: string): Promise<void> {
    if (!to) return;
    const phone = normalizePhone(to);
    if (!phone) { log.warn('sendSms: invalid phone number', { to }); return; }
    if (!atClient) { log.info('sendSms: Africa\'s Talking not configured — skipping', { to: phone, message }); return; }
    try {
        await atClient.SMS.send({ to: [phone], message, from: AT_SENDER });
        log.info('SMS sent', { to: phone });
    } catch (e) {
        log.error('sendSms failed', { to: phone, error: e });
    }
}

async function sendEmail(to: string | null, subject: string, html: string): Promise<void> {
    if (!to) return;
    if (!resend) { log.info('sendEmail: Resend not configured — skipping', { to, subject }); return; }
    try {
        await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
        log.info('Email sent', { to, subject });
    } catch (e) {
        log.error('sendEmail failed', { to, error: e });
    }
}

// 2. Event Handlers
async function handleOrderCreated(event: OrderCreatedEvent) {
    const { data } = event;
    // Stock decrement is handled by catalog-service (order.created → catalog-order-created subscription)
    log.info('handleOrderCreated', { order: data.order_id, to: data.email });

    await sendEmail(
        data.email,
        `Order Confirmation — #${data.order_id.slice(0, 8).toUpperCase()}`,
        `<h2>Thank you for your order!</h2>
<p>Hi ${data.customer_name || 'there'},</p>
<p>Your order <strong>#${data.order_id.slice(0, 8).toUpperCase()}</strong> has been received and is being processed.</p>
<p><strong>Total: KES ${data.total_amount?.toLocaleString() ?? '—'}</strong></p>
<p>We'll notify you when your order is dispatched. Track your order at <a href="https://trovestak.com">trovestak.com</a>.</p>
<p>— The Trovestak Team</p>`
    );
}

async function handlePaymentConfirmed(event: PaymentConfirmedEvent) {
    const { data } = event;
    log.info('handlePaymentConfirmed', { order: data.order_id, phone: data.phone });

    await sendSms(
        data.phone,
        `Trovestak: Payment of KES ${data.amount_kes?.toLocaleString() ?? '—'} confirmed for order #${data.order_id.slice(0, 8).toUpperCase()}. We'll dispatch your order shortly. Track at trovestak.com`
    );
}

async function handleStockLow(event: StockLowEvent) {
    const { data } = event;
    log.warn(`Stock low for ${data.product_name}`);
}

async function handleOrderUpdated(event: { data: { order_id: string; status: string; updated_at: string } }) {
    const { data } = event;
    log.info('handleOrderUpdated', { order: data.order_id, status: data.status });

    const statusLabels: Record<string, string> = {
        processing: 'being processed',
        packing: 'being packed',
        dispatched: 'on its way to you',
        completed: 'delivered',
        cancelled: 'cancelled',
    };
    const label = statusLabels[data.status] || data.status;

    // Fetch customer phone from DB for SMS
    if (supabase) {
        const { data: order } = await supabase
            .from('orders')
            .select('customer_phone, customer_name')
            .eq('id', data.order_id)
            .maybeSingle();

        if (order?.customer_phone) {
            await sendSms(
                order.customer_phone,
                `Trovestak: Hi ${order.customer_name || 'there'}, your order #${data.order_id.slice(0, 8).toUpperCase()} is now ${label}. Visit trovestak.com for details.`
            );
        }
    }
}

async function handleOrderDispatched(event: OrderDispatchedEvent) {
    const { data } = event;
    const address = data.shipping_address;
    const locality = address?.county || address?.city || address?.town || 'your location';
    log.info('handleOrderDispatched', { order: data.order_id, phone: data.customer_phone });

    await sendSms(
        data.customer_phone,
        `Trovestak: Hi ${data.customer_name || 'there'}, your order #${data.order_id.slice(0, 8).toUpperCase()} has been dispatched to ${locality}. Your rider ${data.rider_name ? `(${data.rider_name})` : ''} is on the way. Track at trovestak.com`
    );
}

// 3. Subscription Management
const subscriptions = [
    { name: env.PUBSUB_SUBSCRIPTION_ORDER_CREATED, handler: handleOrderCreated },
    { name: env.PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED, handler: handlePaymentConfirmed },
    { name: env.PUBSUB_SUBSCRIPTION_STOCK_LOW, handler: handleStockLow },
    { name: env.PUBSUB_SUBSCRIPTION_ORDER_DISPATCHED, handler: handleOrderDispatched },
    { name: env.PUBSUB_SUBSCRIPTION_ORDER_UPDATED, handler: handleOrderUpdated },
];

function startSubscribers() {
    subscriptions.forEach(({ name, handler }) => {
        const sub = pubsub.subscription(name);
        sub.on("message", async (message) => {
            try {
                const payload = JSON.parse(message.data.toString());
                await handler(payload);
                message.ack();
            } catch (error) { log.error(`Error in sub ${name}`, { error }); message.nack(); }
        });
        log.info(`Subscribed to ${name}`);
    });
}

// 4. Scheduled Job Handlers (called by Cloud Scheduler)
async function jobStockAlerts(): Promise<{ fired: number }> {
    if (!supabase) { log.warn("jobStockAlerts: no Supabase client — skipping"); return { fired: 0 }; }

    const { data, error } = await supabase
        .from("product_variants")
        .select("id, sku, stock_quantity, low_stock_threshold, products:product_id(name, nav_category)")
        .filter("stock_quantity", "lte", supabase.rpc("low_stock_threshold", {}))
        .eq("products.status", "published")
        .limit(200);

    // Fallback: manual threshold comparison
    const { data: variants } = await supabase
        .from("product_variants")
        .select("id, sku, stock_quantity, low_stock_threshold, product:product_id(name, nav_category, status)")
        .lt("stock_quantity", 10)
        .limit(200);

    let fired = 0;
    for (const v of (variants || [])) {
        const product = (v as any).product;
        if (product?.status !== "published") continue;
        const threshold = v.low_stock_threshold ?? 10;
        if (v.stock_quantity > threshold) continue;

        await publishEvent(
            TOPICS.STOCK_LOW,
            createEvent(TOPICS.STOCK_LOW, "notif-service-scheduler", {
                variant_id: v.id,
                sku: v.sku,
                product_name: product?.name ?? "Unknown",
                nav_category: product?.nav_category ?? null,
                stock_quantity: v.stock_quantity,
                threshold,
            })
        ).catch(err => log.error("publishEvent STOCK_LOW failed", { err }));
        fired++;
    }

    log.info(`jobStockAlerts: fired ${fired} stock.low events`);
    return { fired };
}

async function jobRevenueDigest(): Promise<{ total_kes: number; order_count: number }> {
    if (!supabase) { log.warn("jobRevenueDigest: no Supabase client — skipping"); return { total_kes: 0, order_count: 0 }; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", today.toISOString());

    if (error) { log.error("jobRevenueDigest: query error", { error }); return { total_kes: 0, order_count: 0 }; }

    const total_kes = (data || []).reduce((s, o) => s + (o.total_amount || 0), 0);
    const order_count = (data || []).length;

    log.info("Daily revenue digest", {
        date: today.toISOString().slice(0, 10),
        total_kes,
        order_count,
        avg_kes: order_count > 0 ? Math.round(total_kes / order_count) : 0,
    });

    return { total_kes, order_count };
}

async function jobMpesaReconcile(): Promise<{ unmatched: number }> {
    if (!supabase) { log.warn("jobMpesaReconcile: no Supabase client — skipping"); return { unmatched: 0 }; }

    const { data, error } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, customer_name")
        .eq("payment_status", "paid")
        .eq("payment_method", "mpesa")
        .is("mpesa_receipt_number", null)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) { log.error("jobMpesaReconcile: query error", { error }); return { unmatched: 0 }; }

    const unmatched = (data || []).length;
    if (unmatched > 0) {
        log.warn(`M-Pesa reconciliation: ${unmatched} paid orders missing receipt number`, {
            order_ids: (data || []).map(o => o.id),
        });
    } else {
        log.info("M-Pesa reconciliation: all paid orders have receipt numbers");
    }

    return { unmatched };
}

// 5. Server Initialization & Health Check
const PORT = process.env.PORT || 8080;
const server = http.createServer(async (req, res) => {
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
    } else if (req.method === "POST" && req.url === "/jobs/stock-alerts") {
        try {
            const result = await jobStockAlerts();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, ...result }));
        } catch (e: any) {
            log.error("jobStockAlerts failed", { error: e.message });
            res.writeHead(500);
            res.end(JSON.stringify({ ok: false, error: e.message }));
        }
    } else if (req.method === "POST" && req.url === "/jobs/revenue-digest") {
        try {
            const result = await jobRevenueDigest();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, ...result }));
        } catch (e: any) {
            log.error("jobRevenueDigest failed", { error: e.message });
            res.writeHead(500);
            res.end(JSON.stringify({ ok: false, error: e.message }));
        }
    } else if (req.method === "POST" && req.url === "/jobs/mpesa-reconcile") {
        try {
            const result = await jobMpesaReconcile();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, ...result }));
        } catch (e: any) {
            log.error("jobMpesaReconcile failed", { error: e.message });
            res.writeHead(500);
            res.end(JSON.stringify({ ok: false, error: e.message }));
        }
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    log.info(`notif-service listening on port ${PORT}`);
    startSubscribers();
});

const shutdown = () => {
    log.info("Shutting down...");
    server.close();
    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
