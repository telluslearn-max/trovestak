import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    const { session_id, limit } = await req.json();

    if (!session_id) {
        return NextResponse.json({ recommendations: [] });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try ml-service affinities (2s timeout, non-blocking)
    const affinityMap: Record<string, number> = {};
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        const mlRes = await fetch(
            `${process.env.ML_SERVICE_URL ?? "http://localhost:8001"}/affinities/${session_id}`,
            { signal: ctrl.signal }
        );
        clearTimeout(t);
        if (mlRes.ok) {
            const { affinities } = await mlRes.json();
            for (const { category_id, affinity } of (affinities ?? [])) {
                affinityMap[category_id] = affinity as number;
            }
        }
    } catch {
        // fallback silently — pgvector handles it
    }

    // Fetch more results than needed so we can re-rank with TF scores
    const fetchLimit = (limit || 5) * 2;
    const { data, error } = await supabase
        .rpc("get_recommendations", { p_session_id: session_id, p_limit: fetchLimit });

    if (error) {
        return NextResponse.json({ recommendations: [] });
    }

    let results: any[] = data ?? [];

    // Blend TF category affinities into pgvector similarity score
    if (Object.keys(affinityMap).length > 0) {
        results = results
            .map((r) => ({
                ...r,
                score: (r.score ?? 0) + (affinityMap[r.nav_category] ?? 0) * 0.3,
            }))
            .sort((a, b) => b.score - a.score);
    }

    return NextResponse.json({
        recommendations: results.slice(0, limit || 5),
        source: Object.keys(affinityMap).length > 0 ? "tf+pgvector" : "pgvector",
    });
}
