// ============================================
// CLOUD PUB/SUB EVENT SCHEMAS
// Typed message contracts for all microservices
// ============================================
/** All Pub/Sub topic names — single source of truth */
export const TOPICS = {
    ORDER_CREATED: "order.created",
    ORDER_UPDATED: "order.updated",
    ORDER_DISPATCHED: "order.dispatched",
    PAYMENT_INITIATE: "payment.initiate",
    PAYMENT_CONFIRMED: "payment.confirmed",
    PAYMENT_FAILED: "payment.failed",
    STOCK_LOW: "stock.low",
    STOCK_UPDATED: "stock.updated",
    AGENT_INTENT: "agent.intent",
    RECOMMENDATION_READY: "recommendation.ready",
    PRODUCT_IMPORT: "product.import",
};
// ── Utility: create a typed event envelope ───────────────────────────────────
export function createEvent(topic, source, data) {
    return {
        id: crypto.randomUUID(),
        topic,
        timestamp: new Date().toISOString(),
        source,
        version: "1.0",
        data,
    };
}
