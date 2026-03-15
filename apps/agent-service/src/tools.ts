import { FunctionTool } from "@google/adk";
import { Type } from "@google/genai";
import { createSupabaseAdminClient } from "@trovestak/shared";

/**
 * CONCIERGE TOOLS — TroveStack AI Bible §9
 * All implementations follow Bible spec exactly.
 */

// ─── §9 / §6.4 SEARCH PRODUCTS ───────────────────────────────────────────────
export const searchProductsTool = new FunctionTool({
    name: "search_products",
    description: "Search TroveStack catalog. For vague queries, first call research_agent to expand intent into specific queries, then call this tool with each query.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query:         { type: Type.STRING, description: "Product search query" },
            category:      { type: Type.STRING, description: "Optional category filter: Smartphones | Laptops | Audio | Gaming | Cameras | Wearables | Smart Home" },
            max_price_kes: { type: Type.NUMBER, description: "Optional budget ceiling in KES" },
        },
        required: ["query"]
    },
    execute: async (input: any) => {
        const { query, category, max_price_kes } = input;
        const supabase = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Tier 1: Semantic search via pgvector (Bible §6.1)
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "models/gemini-embedding-001",
                        content: { parts: [{ text: query }] },
                        outputDimensionality: 768,
                    }),
                }
            );
            const json = await res.json() as any;
            if (!res.ok) throw new Error(JSON.stringify(json));
            const embedding: number[] = json.embedding.values;

            const { data, error } = await supabase.rpc("match_products", {
                query_embedding: embedding,
                match_threshold: 0.4,
                match_count: 5,
                filter_category: category || null,
            });

            if (!error && data?.length > 0) {
                const filtered = max_price_kes
                    ? data.filter((p: any) => p.sell_price <= max_price_kes)
                    : data;
                if (filtered.length > 0) return { products: filtered, search_type: "semantic" };
            }
        } catch (e) {
            // Semantic search failed — fall through to text search
        }

        // Tier 2: Full-text then ilike (Bible §6.1 Fallback)
        let q = supabase
            .from("products")
            .select("id, name, brand, nav_category, sell_price, slug, images")
            .eq("status", "published")
            .ilike("name", `%${query}%`);

        if (category) q = (q as any).eq("nav_category", category);
        if (max_price_kes) q = (q as any).lte("sell_price", max_price_kes);

        const { data } = await (q as any).limit(5);
        return { products: data || [], search_type: "text" };
    }
});

// ─── §9.2 GET CONCIERGE CONTEXT ──────────────────────────────────────────────
export const getConciergeContextTool = new FunctionTool({
    name: "get_concierge_context",
    description: "Retrieve the shopper's taste profile and preferences to personalise recommendations.",
    parameters: {
        type: Type.OBJECT,
        properties: { session_id: { type: Type.STRING } },
    },
    execute: async (input: any) => {
        const supabase = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data } = await supabase
            .from("user_preferences")
            .select("*")
            .eq("session_id", input.session_id)
            .single();

        return {
            preferences: data || {
                categories: [],
                brands: [],
                budget_min: null,
                budget_max: null,
                past_purchases: [],
                location: "Nairobi, Kenya",
            }
        };
    }
});

// ─── §9.3 COMPARE PRODUCTS ───────────────────────────────────────────────────
export const compareProductsTool = new FunctionTool({
    name: "compare_products",
    description: "Compare 2-3 products side by side on specs, price, and use-case fit.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            product_ids: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 2-3 product IDs to compare"
            },
            use_case: {
                type: Type.STRING,
                description: "What the shopper will use the product for"
            }
        },
        required: ["product_ids"]
    },
    execute: async (input: any) => {
        const supabase = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data } = await supabase
            .from("products")
            .select("id, name, brand, nav_category, sell_price, content_specifications")
            .in("id", input.product_ids);

        return {
            products: data,
            use_case: input.use_case || null,
            instruction: "Compare these products on the specs most relevant to the use case. Explain trade-offs in plain English, not spec dumps."
        };
    }
});

// ─── §9.4 INITIATE CHECKOUT ──────────────────────────────────────────────────
export const initiateCheckoutTool = new FunctionTool({
    name: "initiate_checkout",
    description: "Initiate an M-Pesa STK Push payment for the shopper's cart.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            phone:      { type: Type.STRING, description: "M-Pesa phone number e.g. 0712345678" },
            amount_kes: { type: Type.NUMBER, description: "Amount in KES" },
            order_id:   { type: Type.STRING, description: "Order ID from Supabase" },
        },
        required: ["phone", "amount_kes", "order_id"]
    },
    execute: async (input: any) => {
        const mpesaUrl = process.env.MPESA_SERVICE_URL || "https://mpesa-service-293424180731.us-central1.run.app";
        try {
            const response = await fetch(`${mpesaUrl}/stk-push`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            const result = await response.json();
            return {
                status: result.success ? "stk_push_sent" : "failed",
                message: result.success
                    ? `M-Pesa prompt sent to ${input.phone}. Please enter your PIN to complete payment.`
                    : `Payment initiation failed: ${result.error}`,
            };
        } catch (err: any) {
            return { status: "failed", message: `Could not reach M-Pesa service: ${err.message}` };
        }
    }
});

// ─── §7.4 GET ML RECOMMENDATIONS ─────────────────────────────────────────────
export const getMlRecommendationsTool = new FunctionTool({
    name: "get_ml_recommendations",
    description: "Fetch TensorFlow-powered personalised product recommendations based on the shopper's taste profile.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            session_id: { type: Type.STRING },
            limit:      { type: Type.NUMBER, description: "Max recommendations, default 5" },
        },
        required: ["session_id"]
    },
    execute: async (input: any) => {
        const mlUrl = process.env.ML_SERVICE_URL || "https://ml-service-293424180731.us-central1.run.app";
        try {
            const response = await fetch(`${mlUrl}/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: input.session_id,
                    limit: input.limit || 5,
                }),
            });
            if (!response.ok) throw new Error(`ML service error: ${response.status}`);
            return await response.json();
        } catch (e) {
            return { recommendations: [], error: "ML service unavailable — falling back to popular items" };
        }
    }
});

// ─── WHATSAPP HANDOFF ─────────────────────────────────────────────────────────
export const whatsappHandoffTool = new FunctionTool({
    name: "whatsapp_handoff",
    description: "Escalate to a human agent on WhatsApp for delivery queries, bulk orders, or warranty specifics.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            context_summary: { type: Type.STRING, description: "Summary of what the shopper needs" }
        },
        required: ["context_summary"]
    },
    execute: async (input: any) => {
        const adminPhone = process.env.WHATSAPP_PHONE || "254700000000";
        const message = encodeURIComponent(`Hi TroveStack! I need help with: ${input.context_summary}`);
        return {
            whatsapp_link: `https://wa.me/${adminPhone}?text=${message}`,
            message: "I've prepared a WhatsApp link — our team will assist you within minutes."
        };
    }
});

// ─── TOOLS REGISTRY ───────────────────────────────────────────────────────────
// Bible §9.1 Complete Tools Registry
export const conciergeTools = [
    searchProductsTool,
    getConciergeContextTool,
    compareProductsTool,
    initiateCheckoutTool,
    getMlRecommendationsTool,
    whatsappHandoffTool,
];
