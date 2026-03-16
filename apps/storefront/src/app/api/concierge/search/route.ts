import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    const { query, category, max_price_kes } = await req.json();

    if (!query) {
        return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Tier 1: Semantic search via pgvector
    try {
        const embedRes = await fetch(
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
        const embedJson = await embedRes.json() as any;
        if (!embedRes.ok) throw new Error(JSON.stringify(embedJson));
        const embedding: number[] = embedJson.embedding.values;

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
                return NextResponse.json({ products: filtered, search_type: "semantic" });
            }
        }
    } catch {
        // Fall through to text search
    }

    // Tier 2: ilike text fallback
    let q = supabase
        .from("products")
        .select("id, name, brand, nav_category, sell_price, slug, images")
        .eq("status", "published")
        .ilike("name", `%${query}%`);

    if (category) q = (q as any).eq("nav_category", category);
    if (max_price_kes) q = (q as any).lte("sell_price", max_price_kes);

    const { data } = await (q as any).limit(5);

    return NextResponse.json({ products: data || [], search_type: "text" });
}
