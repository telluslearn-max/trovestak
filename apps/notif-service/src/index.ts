import http from "http";
import "dotenv/config";
import { PubSub } from "@google-cloud/pubsub";
import { Resend } from "resend";
import {
    createLogger,
    validateEnv,
    TOPICS,
    OrderCreatedEvent,
    PaymentConfirmedEvent,
    StockLowEvent
} from "@trovestak/shared";

/**
 * NOTIF SERVICE
 */

const log = createLogger("notif-service");

// 1. Validate environment
const env = validateEnv([
    "GOOGLE_CLOUD_PROJECT",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "PUBSUB_SUBSCRIPTION_ORDER_CREATED",
    "PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED",
    "PUBSUB_SUBSCRIPTION_STOCK_LOW"
]);

const pubsub = new PubSub({ projectId: env.GOOGLE_CLOUD_PROJECT });
const resend = new Resend(env.RESEND_API_KEY);

// 2. Event Handlers
async function handleOrderCreated(event: OrderCreatedEvent) {
    const { data } = event;
    log.info(`Sending order confirmation for ${data.order_id}`, { customer: data.email });
    try {
        await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: data.email,
            subject: `Order Received - Trovestak #${data.order_id.slice(0, 8).toUpperCase()}`,
            html: `<p>Thanks for your order #${data.order_id.slice(0, 8).toUpperCase()}!</p>`
        });
    } catch (error) { log.error("Email failed", { error }); }
}

async function handlePaymentConfirmed(event: PaymentConfirmedEvent) {
    const { data } = event;
    log.info(`Sending payment receipt for order ${data.order_id}`);
    try {
        await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: data.email || "customer@example.com",
            subject: `Payment Confirmed - Receipt ${data.mpesa_receipt}`,
            html: `<p>Payment confirmed for order #${data.order_id.slice(0, 8).toUpperCase()}</p>`
        });
    } catch (error) { log.error("Email failed", { error }); }
}

async function handleStockLow(event: StockLowEvent) {
    const { data } = event;
    log.warn(`Stock low for ${data.product_name}`);
}

// 3. Subscription Management
const subscriptions = [
    { name: env.PUBSUB_SUBSCRIPTION_ORDER_CREATED, handler: handleOrderCreated },
    { name: env.PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED, handler: handlePaymentConfirmed },
    { name: env.PUBSUB_SUBSCRIPTION_STOCK_LOW, handler: handleStockLow }
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

// 4. Server Initialization & Health Check
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
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
