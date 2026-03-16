import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    const { product_ids, use_case } = await req.json();

    if (!Array.isArray(product_ids) || product_ids.length < 2) {
        return NextResponse.json({ error: "product_ids must be an array of 2-3 IDs" }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, nav_category, sell_price, content_specifications, slug")
        .in("id", product_ids);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        products: data,
        use_case: use_case || null,
        instruction: "Compare these products on the specs most relevant to the use case. Explain trade-offs in plain English, not spec dumps.",
    });
}
