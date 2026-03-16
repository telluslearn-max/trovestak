import "dotenv/config";
import express from "express";
import { PubSub } from "@google-cloud/pubsub";
import {
    createLogger,
    validateEnv,
    TOPICS,
    PaymentInitiateEvent,
    createEvent,
    createSupabaseAdminClient,
    normalizePhone,
} from "@trovestak/shared";
import { getDarajaToken, initiateSTKPushRequest } from "./daraja.js";

/**
 * MPESA SERVICE - Production Implementation
 */

const log = createLogger("mpesa-service");

// 1. Validate environment
const env = validateEnv([
    "GOOGLE_CLOUD_PROJECT",
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_PASSKEY",
    "MPESA_SHORTCODE",
    "MPESA_CALLBACK_URL",
    "PUBSUB_SUBSCRIPTION_PAYMENT_INITIATE",
    "PUBSUB_TOPIC_PAYMENT_CONFIRMED",
    "PUBSUB_TOPIC_PAYMENT_FAILED",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
]);

let pubsub: PubSub | null = null;
const canInitializePubSub = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.PUBSUB_EMULATOR_HOST || process.env.NODE_ENV === "production";

if (canInitializePubSub) {
    try {
        pubsub = new PubSub({ projectId: env.GOOGLE_CLOUD_PROJECT });
    } catch (e) {
        log.warn("PubSub initialization failed. Local developers should use the HTTP fallback.");
    }
} else {
    log.info("Bypassing PubSub initialization (no credentials or emulator found). Using HTTP fallback.");
}

const supabase = createSupabaseAdminClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const app = express();
app.use(express.json());

// ── PUBSUB STARTUP ────────────────────────────────────────────────────────
if (pubsub) {
    try {
        log.info("Starting PubSub subscribers...");
        startSubscribers();
    } catch (e) {
        log.warn("Failed to start PubSub subscribers. Local fallback remains active.");
    }
} else {
    log.warn("Running without PubSub. ONLY Local HTTP fallback will process payments.");
}
async function handlePaymentInitiate(event: PaymentInitiateEvent) {
    const { data } = event;
    const { order_id, mpesa_phone, amount_kes } = data;

    log.info(`Processing payment initiation for order ${order_id}`, { amount: amount_kes });

    try {
        // A. Get Daraja Token
        const token = await getDarajaToken(env.MPESA_CONSUMER_KEY, env.MPESA_CONSUMER_SECRET);
        if (!token) throw new Error("Could not get Daraja token");

        // B. Initiate STK Push
        const stkResponse = await initiateSTKPushRequest({
            token,
            businessShortCode: env.MPESA_SHORTCODE,
            passkey: env.MPESA_PASSKEY,
            amount: amount_kes,
            phone: normalizePhone(mpesa_phone) || mpesa_phone,
            callbackUrl: env.MPESA_CALLBACK_URL,
            accountReference: `Order ${order_id}`,
            transactionDesc: "Trovestak Order Payment",
        });

        log.info(`STK Push initiated for order ${order_id}`, { checkoutRequestId: stkResponse.CheckoutRequestID });

        // C. Store CheckoutRequestID in Supabase for matching the callback later
        const { error } = await supabase
            .from("orders")
            .update({
                mpesa_checkout_request_id: stkResponse.CheckoutRequestID,
                status: "pending" // Ensure status is pending
            })
            .eq("id", order_id);

        if (error) log.error(`Failed to update order ${order_id} with CheckoutRequestID`, { error });

    } catch (error: any) {
        log.error(`Payment initiation failed for order ${order_id}`, { error: error.message });
    }
}

function startSubscribers() {
    if (!pubsub) {
        log.warn("Skipping PubSub subscribers (PubSub not initialized)");
        return;
    }
    const sub = pubsub.subscription(env.PUBSUB_SUBSCRIPTION_PAYMENT_INITIATE);

    // Handle authentication or connection errors gracefully
    sub.on("error", (err) => {
        log.error("PubSub subscription error", { error: err.message });
    });

    sub.on("message", async (message) => {
        try {
            const payload = JSON.parse(message.data.toString());
            await handlePaymentInitiate(payload);
            message.ack();
        } catch (error) {
            log.error("Error processing message from payment-initiate sub", { error });
            message.nack();
        }
    });

    log.info(`Subscribed to ${env.PUBSUB_SUBSCRIPTION_PAYMENT_INITIATE}`);
}

// 3. M-Pesa Callback Handler
app.post("/callback/mpesa", async (req, res) => {
    const body = req.body;
    const stk = body?.Body?.stkCallback;

    if (!stk) {
        log.error("Invalid M-Pesa callback payload received", { body });
        return res.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stk;
    log.info(`M-Pesa callback received for CheckoutRequestID: ${CheckoutRequestID}`, { ResultCode });

    try {
        // A. Find matching order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, status, total_amount, email")
            .eq("mpesa_checkout_request_id", CheckoutRequestID)
            .single();

        if (orderError || !order) {
            log.error(`No order found for CheckoutRequestID: ${CheckoutRequestID}`, { orderError });
            return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        if (order.status === "paid" || order.status === "processing") {
            log.info(`Order ${order.id} already processed. Ignoring callback.`);
            return res.json({ ResultCode: 0, ResultDesc: "Already processed" });
        }

        if (ResultCode === 0) {
            // ── PAYMENT SUCCESS ────────────────────────────────────────────────────
            const metadata = CallbackMetadata?.Item || [];
            const getItem = (name: string) => metadata.find((i: any) => i.Name === name)?.Value;

            const mpesaReceipt = getItem("MpesaReceiptNumber");

            await supabase
                .from("orders")
                .update({
                    status: "processing",
                    payment_status: "paid",
                    mpesa_receipt_number: mpesaReceipt,
                    paid_at: new Date().toISOString(),
                    payment_metadata: { callback_metadata: CallbackMetadata },
                })
                .eq("id", order.id);

            log.info(`Order ${order.id} marked as PAID`, { mpesaReceipt });

            // Publish Success Event
            const successEvent = createEvent(TOPICS.PAYMENT_CONFIRMED, "mpesa-service", {
                order_id: order.id,
                mpesa_receipt: mpesaReceipt,
                amount_kes: order.total_amount,
                phone: getItem("PhoneNumber") || "",
                confirmed_at: new Date().toISOString()
            });
            if (pubsub) {
                await pubsub.topic(env.PUBSUB_TOPIC_PAYMENT_CONFIRMED).publishMessage({ json: successEvent });
            }

        } else {
            // ── PAYMENT FAILED ────────────────────────────────────────────────────
            await supabase
                .from("orders")
                .update({
                    status: "cancelled",
                    payment_status: "failed",
                    notes: `M-Pesa payment failed: ${ResultDesc} (code ${ResultCode})`,
                })
                .eq("id", order.id);

            log.warn(`Order ${order.id} payment failed`, { ResultCode, ResultDesc });

            // Publish Failed Event
            const failedEvent = createEvent(TOPICS.PAYMENT_FAILED, "mpesa-service", {
                order_id: order.id,
                reason: ResultDesc,
                phone: "" // Not always available in failure
            });
            if (pubsub) {
                await pubsub.topic(env.PUBSUB_TOPIC_PAYMENT_FAILED).publishMessage({ json: failedEvent });
            }
        }

        res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (err: any) {
        log.error("Fatal error in M-Pesa callback handler", { error: err.message });
        res.json({ ResultCode: 0, ResultDesc: "Accepted with error" });
    }
});

// ── LOCAL DEVELOPMENT FALLBACK ─────────────────────────────────────────────
// Allow storefront to trigger initiation directly via HTTP when PubSub is unavailable
app.post("/local/payment-initiate", async (req, res) => {
    log.info("Received local payment initiation request (HTTP Fallback)");
    try {
        await handlePaymentInitiate(req.body);
        res.json({ success: true, message: "Local dispatch successful" });
    } catch (error: any) {
        log.error("Local payment initiation failed", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});


// 4. Server Initialization
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    log.info(`mpesa-service listening on port ${PORT}`);
});


const shutdown = () => {
    log.info("mpesa-service shutting down gracefully...");
    process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
