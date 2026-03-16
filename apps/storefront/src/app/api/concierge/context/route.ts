import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    const { session_id } = await req.json();

    if (!session_id) {
        return NextResponse.json({ categories: [], event_count: 0 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: events } = await supabase
        .from("user_events")
        .select("category_id, product_id")
        .eq("session_id", session_id)
        .order("created_at", { ascending: false })
        .limit(50);

    // Tally top categories
    const counts: Record<string, number> = {};
    for (const e of events ?? []) {
        if (e.category_id) counts[e.category_id] = (counts[e.category_id] ?? 0) + 1;
    }
    const topCategories = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c);

    // Persist derived preferences (fire-and-forget, ignore errors)
    void supabase.from("user_preferences").upsert(
        { session_id, categories: topCategories, updated_at: new Date().toISOString() },
        { onConflict: "session_id" }
    );

    return NextResponse.json({ categories: topCategories, event_count: events?.length ?? 0 });
}
