import { createSupabaseAdminClient } from "@trovestak/shared";
import { TOPICS, createEvent, publishEvent } from "@trovestak/shared";
import { FunctionTool } from "@google/adk";
import { Type } from "@google/genai";

/**
 * CONCIERGE TOOLS
 * Typed FunctionTool definitions for TroveVoice Shopping Concierge.
 */

export const searchProductsTool = new FunctionTool({
    name: "search_products",
    description: "Search for products in the TroveStack catalog by keywords or category.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING },
            category: { type: Type.STRING }
        }
    },
    execute: async (input: unknown) => {
        const { query, category } = input as { query?: string; category?: string };
        const supabase = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        let q = supabase.from("products").select("id, title, description, sell_price, stock_quantity").eq("status", "published");
        if (query) q = q.textSearch("title", query);
        if (category) q = q.eq("category_id", category);
        const { data, error } = await q.limit(5);
        if (error) return { error: error.message };
        return { products: data };
    }
});

export const compareProductsTool = new FunctionTool({
    name: "compare_products",
    description: "Fetch technical specifications for multiple products for side-by-side comparison.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            product_ids: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["product_ids"]
    },
    execute: async (input: unknown) => {
        const { product_ids } = input as { product_ids: string[] };
        const supabase = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data, error } = await supabase
            .from("products")
            .select("id, title, description, sell_price, product_specs(spec_key, spec_value)")
            .in("id", product_ids);
        if (error) return { error: error.message };
        return { comparison_data: data };
    }
});

export const getConciergeContextTool = new FunctionTool({
    name: "get_concierge_context",
    description: "Fetch the shopper's taste profile and behavior to provide personalized advice.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            session_id: { type: Type.STRING }
        },
        required: ["session_id"]
    },
    execute: async (input: unknown) => {
        const { session_id } = input as { session_id: string };
        const supabase = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const [profileResult, eventsResult] = await Promise.all([
            supabase.from("user_taste_profiles").select("*").eq("session_id", session_id).single(),
            supabase.from("user_events").select("event_type, product_id, created_at").eq("session_id", session_id).order("created_at", { ascending: false }).limit(5)
        ]);
        return {
            taste_profile: profileResult.data || { info: "New shopper, no profile yet." },
            recent_behavior: eventsResult.data || []
        };
    }
});

export const whatsappHandoffTool = new FunctionTool({
    name: "whatsapp_handoff",
    description: "Escalate to a human on WhatsApp for delivery or custom requests.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            context_summary: { type: Type.STRING }
        },
        required: ["context_summary"]
    },
    execute: async (input: unknown) => {
        const { context_summary } = input as { context_summary: string };
        const adminPhone = process.env.WHATSAPP_PHONE || "254700000000";
        const message = encodeURIComponent(`Hi TroveStack! I'm interested in: ${context_summary}`);
        return {
            whatsapp_link: `https://wa.me/${adminPhone}?text=${message}`,
            message: "I've prepared a WhatsApp link for you to chat with our human experts."
        };
    }
});

export const initiateCheckoutTool = new FunctionTool({
    name: "initiate_checkout",
    description: "Trigger the M-Pesa STK push for checkout.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            order_id: { type: Type.STRING },
            phone: { type: Type.STRING }
        },
        required: ["order_id", "phone"]
    },
    execute: async (input: unknown) => {
        const { order_id, phone } = input as { order_id: string; phone: string };
        try {
            const event = createEvent(TOPICS.PAYMENT_INITIATE, "agent-service", {
                order_id,
                mpesa_phone: phone,
                amount_kes: 0,
                currency: "KES"
            });
            await publishEvent(TOPICS.PAYMENT_INITIATE, event);
            return { success: true, message: "M-Pesa prompt sent. Please check your phone." };
        } catch (error: any) {
            return { error: error.message };
        }
    }
});

export const getOrderStatusTool = new FunctionTool({
    name: "get_order_status",
    description: "Check fulfillment status of an order.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            order_id: { type: Type.STRING }
        },
        required: ["order_id"]
    },
    execute: async (input: unknown) => {
        const { order_id } = input as { order_id: string };
        const supabase = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data, error } = await supabase
            .from("orders")
            .select("status, payment_status")
            .eq("id", order_id)
            .single();
        if (error) return { error: error.message };
        return { order_status: data.status, payment_status: data.payment_status };
    }
});

export const getMlRecommendationsTool = new FunctionTool({
    name: "get_ml_recommendations",
    description: "Fetch deep personalized category recommendations derived from TensorFlow behavior analysis.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            session_id: { type: Type.STRING }
        },
        required: ["session_id"]
    },
    execute: async (input: unknown) => {
        const { session_id } = input as { session_id: string };
        try {
            const supabase = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            const { data: categories } = await supabase.from("categories").select("id, slug").limit(20);
            if (!categories) return { error: "No categories found" };

            const mlServiceUrl = process.env.ML_SERVICE_URL || "http://ml-service:8001";
            const response = await fetch(`${mlServiceUrl}/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: session_id, category_ids: categories.map((c: { id: string }) => c.id) })
            });

            if (!response.ok) throw new Error(`ML service error: ${response.status}`);
            const mlData = await response.json();

            const enriched = (mlData.recommendations || []).map((rec: Record<string, unknown>) => ({
                ...rec,
                slug: categories.find((c: { id: string; slug: string }) => c.id === rec.category_id)?.slug
            }));

            return { recommendations: enriched };
        } catch (error: any) {
            return { error: `ML integration error: ${error.message}` };
        }
    }
});

export const conciergeTools = [
    searchProductsTool,
    compareProductsTool,
    getConciergeContextTool,
    whatsappHandoffTool,
    initiateCheckoutTool,
    getOrderStatusTool,
    getMlRecommendationsTool
];
