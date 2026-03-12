// ============================================
// TROVESTAK COMMERCE DOMAIN TYPES
// Shared across all microservices
// ============================================

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
    | "pending"
    | "processing"
    | "paid"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
    | "failed";

export interface Order {
    id: string;
    user_id?: string;
    status: OrderStatus;
    total_amount: number;          // in cents (KES × 100)
    subtotal: number;
    shipping_amount: number;
    discount_amount: number;
    vat_amount: number;
    discount_code?: string;
    mpesa_receipt?: string;
    mpesa_phone?: string;
    created_at: string;
    updated_at: string;
    shipping_address?: ShippingAddress;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    variant_id?: string;
    title: string;
    sku?: string;
    quantity: number;
    unit_price: number;            // in cents
    total_price: number;           // in cents
    thumbnail_url?: string;
}

export interface ShippingAddress {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    county: string;
    postal_code?: string;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    quantity: number;
    unit_price: number;            // in cents
    variant_label?: string;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;              // in cents
    vat_total: number;
    vat_enabled: boolean;
}

// ── Discounts ─────────────────────────────────────────────────────────────────

export type DiscountType = "percentage" | "fixed";

export interface Discount {
    id: string;
    code: string;
    type: DiscountType;
    value: number;
    min_order_amount?: number;
    usage_limit?: number;
    times_used: number;
    expires_at?: string;
    is_active: boolean;
}

// ── Customers / Profiles ──────────────────────────────────────────────────────

export interface Profile {
    id: string;
    full_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export type StockStatus = "instock" | "outofstock" | "lowstock" | "backorder";

export interface StockItem {
    product_id: string;
    variant_id?: string;
    quantity: number;
    low_stock_threshold: number;
    status: StockStatus;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = "order" | "stock" | "payment" | "system";

export interface AdminNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    metadata?: Record<string, unknown>;
}
