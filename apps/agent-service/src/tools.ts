import { createSupabaseAdminClient, TOPICS, createEvent, publishEvent } from "@trovestak/shared";

// ─── Pre-warmed recommendation cache ─────────────────────────────────────────
// Populated by the recommendation.ready Pub/Sub subscriber in index.ts.
// Key: session_id / user_id. TTL: 5 minutes.
interface CachedRec { recommendations: any[]; cachedAt: number; }
export const recommendationCache = new Map<string, CachedRec>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * CONCIERGE TOOLS — TroveStack AI Bible §9
 *
 * Plain objects — no @google/adk dependency.
 * Each tool: { name, description, parameters, execute }
 * parameters follow Gemini function declaration schema (string-typed enums).
 */

// ─── §9 / §6.4 SEARCH PRODUCTS ───────────────────────────────────────────────
export const searchProductsTool = {
    name: "search_products",
    description: "Search TroveStack catalog. For vague queries, first call research_agent to expand intent into specific queries, then call this tool with each query.",
    parameters: {
        type: "OBJECT",
        properties: {
            query:         { type: "STRING", description: "Product search query" },
            category:      { type: "STRING", description: "Optional category filter: Smartphones | Laptops | Audio | Gaming | Cameras | Wearables | Smart Home" },
            max_price_kes: { type: "NUMBER", description: "Optional budget ceiling in KES" },
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
                if (filtered.length > 0) {
                    // Publish agent.intent for ml-service behavioral signals (fire-and-forget)
                    publishEvent(TOPICS.AGENT_INTENT, createEvent(TOPICS.AGENT_INTENT, 'agent-service', {
                        query,
                        category: category || null,
                        max_price_kes: max_price_kes || null,
                        result_count: filtered.length,
                        search_type: 'semantic',
                    })).catch(() => { /* non-blocking */ });
                    return { products: filtered, search_type: "semantic" };
                }
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

        if (data?.length > 0) {
            // Publish agent.intent for text search results too (fire-and-forget)
            publishEvent(TOPICS.AGENT_INTENT, createEvent(TOPICS.AGENT_INTENT, 'agent-service', {
                query,
                category: category || null,
                max_price_kes: max_price_kes || null,
                result_count: data.length,
                search_type: 'text',
            })).catch(() => { /* non-blocking */ });
        }

        return { products: data || [], search_type: "text" };
    }
};

// ─── §9.2 GET CONCIERGE CONTEXT ──────────────────────────────────────────────
export const getConciergeContextTool = {
    name: "get_concierge_context",
    description: "Retrieve the shopper's taste profile and preferences to personalise recommendations.",
    parameters: {
        type: "OBJECT",
        properties: { session_id: { type: "STRING" } },
    },
    execute: async (input: any) => {
        const { session_id } = input;
        const supabase = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Read raw events (last 50)
        const { data: events } = await supabase
            .from("user_events")
            .select("category_id, product_id")
            .eq("session_id", session_id)
            .order("created_at", { ascending: false })
            .limit(50);

        // Tally categories
        const counts: Record<string, number> = {};
        for (const e of events ?? []) {
            if (e.category_id) counts[e.category_id] = (counts[e.category_id] ?? 0) + 1;
        }
        const topCategories = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([c]) => c);

        // Upsert derived preferences
        await supabase.from("user_preferences").upsert(
            { session_id, categories: topCategories, updated_at: new Date().toISOString() },
            { onConflict: "session_id" }
        );

        return { categories: topCategories, event_count: events?.length ?? 0 };
    }
};

// ─── §9.3 COMPARE PRODUCTS ───────────────────────────────────────────────────
export const compareProductsTool = {
    name: "compare_products",
    description: "Compare 2-3 products side by side on specs, price, and use-case fit.",
    parameters: {
        type: "OBJECT",
        properties: {
            product_ids: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Array of 2-3 product IDs to compare"
            },
            use_case: {
                type: "STRING",
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
};

// ─── §9.4 INITIATE CHECKOUT ──────────────────────────────────────────────────
export const initiateCheckoutTool = {
    name: "initiate_checkout",
    description: "Create an order and initiate an M-Pesa STK Push payment for the shopper's cart.",
    parameters: {
        type: "OBJECT",
        properties: {
            phone:      { type: "STRING", description: "M-Pesa phone number e.g. 0712345678" },
            amount_kes: { type: "NUMBER", description: "Total order amount in KES" },
            items:      { type: "STRING", description: "JSON array of cart items: [{product_id, variant_id, name, quantity, unit_price}]" },
        },
        required: ["phone", "amount_kes", "items"]
    },
    execute: async (input: any) => {
        const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:8082";
        try {
            let parsedItems: unknown[] = [];
            try { parsedItems = JSON.parse(input.items); } catch (_) { parsedItems = []; }

            const response = await fetch(`${orderServiceUrl}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: input.phone,
                    amount: input.amount_kes,
                    orderData: {
                        source: "voice_agent",
                        items: parsedItems,
                    },
                }),
            });
            const result = await response.json();
            return {
                status: result.orderId ? "stk_push_sent" : "failed",
                order_id: result.orderId || null,
                message: result.orderId
                    ? `M-Pesa prompt sent to ${input.phone}. Please enter your PIN to complete payment.`
                    : `Payment initiation failed: ${result.error || "Unknown error"}`,
            };
        } catch (err: any) {
            return { status: "failed", message: `Could not reach order service: ${err.message}` };
        }
    }
};

// ─── §7.4 GET ML RECOMMENDATIONS ─────────────────────────────────────────────
export const getMlRecommendationsTool = {
    name: "get_ml_recommendations",
    description: "Fetch personalised product recommendations based on the shopper's browsing history.",
    parameters: {
        type: "OBJECT",
        properties: {
            session_id: { type: "STRING" },
            limit:      { type: "NUMBER", description: "Max recommendations, default 5" },
        },
        required: ["session_id"]
    },
    execute: async (input: any) => {
        // Check pre-warmed cache first (populated by recommendation.ready PubSub)
        const cached = recommendationCache.get(input.session_id);
        if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
            return { recommendations: cached.recommendations, source: "cache" };
        }

        const supabase = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data, error } = await supabase
            .rpc("get_recommendations", { p_session_id: input.session_id, p_limit: input.limit || 5 });
        if (error) return { recommendations: [] };
        return { recommendations: data, source: "supabase" };
    }
};

// ─── WHATSAPP HANDOFF ─────────────────────────────────────────────────────────
export const whatsappHandoffTool = {
    name: "whatsapp_handoff",
    description: "Escalate to a human agent on WhatsApp for delivery queries, bulk orders, or warranty specifics.",
    parameters: {
        type: "OBJECT",
        properties: {
            context_summary: { type: "STRING", description: "Summary of what the shopper needs" }
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
};

// ─── TOOLS REGISTRY ───────────────────────────────────────────────────────────
export const conciergeTools = [
    searchProductsTool,
    getConciergeContextTool,
    compareProductsTool,
    initiateCheckoutTool,
    getMlRecommendationsTool,
    whatsappHandoffTool,
];
