"use server";

import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { paymentLimiter } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/mpesa";
import { TOPICS, createEvent, publishEvent } from "@trovestak/shared";

/**
 * Validates a discount code
 */
export async function validateDiscountAction(code: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .gt("ends_at", new Date().toISOString())
        .eq("is_active", true)
        .single();

    if (error || !data) {
        return { error: "Invalid or expired discount code" };
    }

    return {
        success: true,
        discount: {
            code: data.code,
            type: data.type,
            value: data.value
        }
    };
}

/**
 * Fetches the shipping rate for a specific county
 */
export async function getShippingRateAction(countyName: string) {
    const supabase = await createSupabaseServerClient();

    // Logic: shipping_zones -> shipping_rates
    const { data: zones } = await supabase
        .from("shipping_zones")
        .select("id")
        .contains("counties", [countyName])
        .limit(1);

    if (!zones || zones.length === 0) {
        return { rate: 1500 }; // Default fallback
    }

    const { data: rates } = await supabase
        .from("shipping_rates")
        .select("rate_amount")
        .eq("zone_id", zones[0].id)
        .order("rate_amount", { ascending: true })
        .limit(1);

    if (!rates || rates.length === 0) {
        return { rate: 1500 }; // Default fallback
    }

    return { rate: rates[0].rate_amount };
}

interface CartItem {
    id: string;
    product_id: string;
    variant_id: string;
    title: string;
    quantity: number;
    unit_price: number; // cents
    thumbnail?: string;
}

interface ValidationResult {
    valid: boolean;
    items: (CartItem & {
        status: "ok" | "price_changed" | "out_of_stock" | "low_stock" | "removed";
        currentPrice: number;
        availableStock: number | null;
        message?: string;
    })[];
    warnings: string[];
    errors: string[];
}

/**
 * Server-side cart reconciliation.
 * Validates existence, status, price, and stock for each item.
 */
export async function validateCartAction(items: CartItem[]): Promise<ValidationResult> {
    const supabase = await createSupabaseServerClient();
    const result: ValidationResult = { valid: true, items: [], warnings: [], errors: [] };

    if (!Array.isArray(items) || items.length === 0) {
        return { ...result, valid: false, errors: ["Cart is empty"] };
    }

    // UUID Regex for validation
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of items) {
        if (!UUID_RE.test(item.product_id)) {
            result.errors.push(`Invalid product ID: ${item.product_id}`);
            result.valid = false;
            continue;
        }

        let currentPrice = 0;
        let availableStock: number | null = null;
        let stockStatus = "instock";

        if (item.variant_id && UUID_RE.test(item.variant_id)) {
            // Variable product — look up variant
            const { data: variant } = await supabase
                .from("product_variants")
                .select("id, price_kes, stock_quantity")
                .eq("id", item.variant_id)
                .single();

            if (!variant) {
                result.items.push({
                    ...item,
                    status: "removed",
                    currentPrice: 0,
                    availableStock: 0,
                    message: `"${item.title}" is no longer available`,
                });
                result.errors.push(`"${item.title}" has been removed from the catalog`);
                result.valid = false;
                continue;
            }

            currentPrice = variant.price_kes ?? 0;
            availableStock = variant.stock_quantity ?? 0;
            stockStatus = availableStock > 0 ? "instock" : "outofstock";
        } else {
            // Simple product — look up product directly
            const { data: product } = await supabase
                .from("products")
                .select("id, is_active")
                .eq("id", item.product_id)
                .single();

            if (!product || !product.is_active) {
                result.items.push({
                    ...item,
                    status: "removed",
                    currentPrice: 0,
                    availableStock: 0,
                    message: `"${item.title}" is no longer available`,
                });
                result.errors.push(`"${item.title}" is unavailable`);
                result.valid = false;
                continue;
            }

            const { data: pricing } = await supabase
                .from("product_pricing")
                .select("sell_price")
                .eq("product_id", item.product_id)
                .maybeSingle();

            currentPrice = pricing?.sell_price ?? 0;
            availableStock = 999; // Fallback if no specific variant tracking
            stockStatus = currentPrice > 0 ? "instock" : "outofstock";
        }

        // ── Stock check ────────────────────────────────────────────────────────
        if (stockStatus === "outofstock" || (availableStock !== null && availableStock <= 0)) {
            result.items.push({
                ...item,
                status: "out_of_stock",
                currentPrice,
                availableStock: 0,
                message: `"${item.title}" is out of stock`,
            });
            result.errors.push(`"${item.title}" is out of stock`);
            result.valid = false;
            continue;
        }

        if (availableStock !== null && item.quantity > availableStock) {
            result.items.push({
                ...item,
                quantity: availableStock, // Clamp to available
                status: "low_stock",
                currentPrice,
                availableStock,
                message: `Only ${availableStock} units of "${item.title}" available`,
            });
            result.warnings.push(`Quantity for "${item.title}" reduced to ${availableStock}`);
            result.valid = false;
            continue;
        }

        // ── Price drift check ──────────────────────────────────────────────────
        const TOLERANCE_CENTS = 100; // 1 KES tolerance for rounding
        if (Math.abs(currentPrice - item.unit_price) > TOLERANCE_CENTS) {
            result.items.push({
                ...item,
                unit_price: currentPrice, // Update to current server price
                status: "price_changed",
                currentPrice,
                availableStock,
                message: `Price for "${item.title}" has changed`,
            });
            result.warnings.push(`Price for "${item.title}" updated from ${item.unit_price} to ${currentPrice}`);
            // Note: Price change reflects a warning, and we set valid=false if we want to force user to review.
            // In the original API it didn't set valid=false for price change, just returning warnings.
            // But usually we want the user to confirm the new price.
            // For now, I'll keep it as a warning only as per original logic.
            result.valid = false; // Actually, if we want them to re-review, we should set valid to false.
            continue;
        }

        // ── All clear ──────────────────────────────────────────────────────────
        result.items.push({ ...item, status: "ok", currentPrice, availableStock });
    }

    return result;
}

/**
 * Initiates an M-Pesa STK Push payment.
 */
export async function initiateMpesaStkAction(phone: string, amount: number, orderData: any) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";

    const rl = paymentLimiter.check(ip);
    if (!rl.success) {
        return { error: "Too many requests. Please wait." };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return { error: "Invalid phone number" };

    const supabase = getSupabaseAdmin();

    // ── Create Order ───────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
        .from("orders")
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
            payment_method: "mpesa",
            status: "pending",
            mpesa_phone: normalizedPhone,
        })
        .select("id")
        .single();

    if (orderError || !order) {
        console.error("Order failed:", orderError);
        return { error: "Failed to create order" };
    }

    const orderId = order.id;

    // ── Create Order Items ─────────────────────────────────────────────────────
    if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
            order_id: orderId,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
        }));

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemsError) {
            console.error("Order items failed:", itemsError);
            // Optionally delete the order here if item creation fails
        }
    }

    // ── Publish Global Events ────────────────────────────────────────────────
    try {
        // 1. Publish Order Created Event (Triggers Notif + ML)
        const orderCreatedEvent = createEvent(TOPICS.ORDER_CREATED, "storefront", {
            order_id: orderId,
            customer_name: `${orderData.firstName} ${orderData.lastName}`.trim(),
            email: orderData.email,
            total_amount: Math.ceil(amount),
            items: orderData.items,
            shipping_address: {
                first_name: orderData.firstName,
                last_name: orderData.lastName,
                county: orderData.county
            }
        });
        await publishEvent(TOPICS.ORDER_CREATED, orderCreatedEvent);

        // 2. Publish Payment Initiation Event (Triggers M-Pesa Service)
        const paymentEvent = createEvent(TOPICS.PAYMENT_INITIATE, "storefront", {
            order_id: orderId,
            mpesa_phone: normalizedPhone,
            amount_kes: Math.ceil(amount / 100), // Convert raw Cents from DB back to absolute KES for M-Pesa Daraja API
            currency: "KES"
        });
        await publishEvent(TOPICS.PAYMENT_INITIATE, paymentEvent);

        // ── LOCAL DEVELOPMENT DISPATCH ──────────────────────────────────────
        // If running locally, dispatch directly to mpesa-service via HTTP
        // because PubSub might not be available or authenticated.
        if (process.env.NODE_ENV === "development") {
            try {
                // Determine mpesa service URL (default 8081)
                const mpesaServiceUrl = process.env.MPESA_SERVICE_URL || "http://localhost:8081";
                await fetch(`${mpesaServiceUrl}/local/payment-initiate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(paymentEvent),
                });
            } catch (dispatchError) {
                console.warn("Local M-Pesa dispatch fallback failed (expected if service is down):", dispatchError);
            }
        }


        return { success: true, orderId };
    } catch (err) {
        console.error("PubSub Event Error:", err);
        // We don't delete the order here because it's already pending in DB
        // The user can retry or we can have a background job.
        return { error: "Payment request queued but failed to transmit. Please check your order status shortly." };
    }
}

/**
 * Checks M-Pesa payment status.
 */
export async function getMpesaStatusAction(orderId: string) {
    const supabase = getSupabaseAdmin();

    const { data: order, error } = await supabase
        .from("orders")
        .select("id, status, payment_status, mpesa_receipt_number, created_at")
        .eq("id", orderId)
        .single();

    if (error || !order) return { status: "not_found" };

    const age = Date.now() - new Date(order.created_at).getTime();
    if (order.status === "processing" && order.payment_status !== "paid" && age > 3 * 60 * 1000) {
        return { status: "timeout", orderId: order.id };
    }

    const statusMap: Record<string, string> = {
        pending: "pending",
        processing: order.payment_status === "paid" ? "paid" : "pending",
        paid: "paid",
        cancelled: "failed",
    };

    return {
        status: statusMap[order.status] || "pending",
        orderId: order.id,
        receiptNumber: order.mpesa_receipt_number || null,
    };
}

/**
 * Creates an order for Manual Till or Cash on Delivery.
 */
export async function createManualOrderAction(amount: number, orderData: any, paymentMethod: "manual_till" | "cod", transactionCode?: string) {
    const supabase = getSupabaseAdmin();

    // ── Create Order ───────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
        .from("orders")
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
            status: "pending_verification", // Admin needs to verify the code
            mpesa_receipt_number: transactionCode || null, // Store manual transaction code here or a custom note
        })
        .select("id")
        .single();

    if (orderError || !order) {
        console.error("Manual order failed:", orderError);
        return { error: "Failed to create order" };
    }

    const orderId = order.id;

    // ── Create Order Items ─────────────────────────────────────────────────────
    if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
            order_id: orderId,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
        }));

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemsError) {
            console.error("Order items failed:", itemsError);
        }
    }

    // ── Publish Global Events ────────────────────────────────────────────────
    try {
        // Publish Order Created Event (Triggers Notif + ML)
        const orderCreatedEvent = createEvent(TOPICS.ORDER_CREATED, "storefront", {
            order_id: orderId,
            customer_name: `${orderData.firstName} ${orderData.lastName}`.trim(),
            email: orderData.email,
            total_amount: Math.ceil(amount),
            items: orderData.items,
            shipping_address: {
                first_name: orderData.firstName,
                last_name: orderData.lastName,
                county: orderData.county
            }
        });
        await publishEvent(TOPICS.ORDER_CREATED, orderCreatedEvent);

        return { success: true, orderId };
    } catch (err) {
        console.error("PubSub Event Error:", err);
        return { success: true, orderId }; // Successfully created, event failed but non-critical for user
    }
}
