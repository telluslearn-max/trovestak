// ============================================
// CLOUD PUB/SUB EVENT SCHEMAS
// Typed message contracts for all microservices
// ============================================

/** All Pub/Sub topic names — single source of truth */
export const TOPICS = {
    ORDER_CREATED: "order.created",
    ORDER_UPDATED: "order.updated",
    PAYMENT_INITIATE: "payment.initiate",
    PAYMENT_CONFIRMED: "payment.confirmed",
    PAYMENT_FAILED: "payment.failed",
    STOCK_LOW: "stock.low",
    STOCK_UPDATED: "stock.updated",
    AGENT_INTENT: "agent.intent",
    RECOMMENDATION_READY: "recommendation.ready",
    PRODUCT_IMPORT: "product.import",
} as const;

export type TopicName = typeof TOPICS[keyof typeof TOPICS];

// ── Base event envelope ───────────────────────────────────────────────────────

export interface BaseEvent<T = unknown> {
    id: string;            // unique event ID (UUID)
    topic: TopicName;
    timestamp: string;     // ISO 8601
    source: string;        // service name that emitted this event
    version: "1.0";
    data: T;
}

// ── order.created ─────────────────────────────────────────────────────────────

export interface OrderCreatedData {
    order_id: string;
    user_id?: string;
    customer_name?: string;
    email: string;
    total_amount: number;  // in cents
    items: Array<{ product_id: string; title: string; quantity: number; unit_price: number }>;
    shipping_address: {
        first_name: string;
        last_name: string;
        county: string;
    };
}

export type OrderCreatedEvent = BaseEvent<OrderCreatedData>;

// ── payment.initiate ──────────────────────────────────────────────────────────

export interface PaymentInitiateData {
    order_id: string;
    mpesa_phone: string;
    amount_kes: number;    // whole KES (not cents)
}

export type PaymentInitiateEvent = BaseEvent<PaymentInitiateData>;

// ── payment.confirmed ─────────────────────────────────────────────────────────

export interface PaymentConfirmedData {
    order_id: string;
    mpesa_receipt: string;
    amount_kes: number;
    phone: string;
    confirmed_at: string;
}

export type PaymentConfirmedEvent = BaseEvent<PaymentConfirmedData>;

// ── payment.failed ────────────────────────────────────────────────────────────

export interface PaymentFailedData {
    order_id: string;
    reason: string;
    phone: string;
}

export type PaymentFailedEvent = BaseEvent<PaymentFailedData>;

// ── stock.low ─────────────────────────────────────────────────────────────────

export interface StockLowData {
    product_id: string;
    variant_id?: string;
    product_name: string;
    current_quantity: number;
    threshold: number;
}

export type StockLowEvent = BaseEvent<StockLowData>;

// ── recommendation.ready ──────────────────────────────────────────────────────

export interface RecommendationReadyData {
    user_id: string;
    product_ids: string[];          // ordered by relevance score
    trigger: "order" | "browse" | "scheduled";
    model_version: string;
}

export type RecommendationReadyEvent = BaseEvent<RecommendationReadyData>;

// ── agent.intent ──────────────────────────────────────────────────────────────

export interface AgentIntentData {
    session_id: string;
    user_id?: string;
    intent: string;                  // e.g. "search_products", "initiate_checkout"
    params: Record<string, unknown>;
}

export type AgentIntentEvent = BaseEvent<AgentIntentData>;

// ── product.import ────────────────────────────────────────────────────────────

export interface ProductImportData {
    batch_id: string;
    product_id: string;
    raw_name: string;
    source: "csv" | "api" | "manual";
}

export type ProductImportEvent = BaseEvent<ProductImportData>;

// ── Utility: create a typed event envelope ───────────────────────────────────

export function createEvent<T>(
    topic: TopicName,
    source: string,
    data: T
): BaseEvent<T> {
    return {
        id: crypto.randomUUID(),
        topic,
        timestamp: new Date().toISOString(),
        source,
        version: "1.0",
        data,
    };
}
