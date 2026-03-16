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

    const { data, error } = await supabase
        .rpc("get_recommendations", { p_session_id: session_id, p_limit: limit || 5 });

    if (error) {
        return NextResponse.json({ recommendations: [] });
    }

    return NextResponse.json({ recommendations: data ?? [], source: "supabase" });
}
