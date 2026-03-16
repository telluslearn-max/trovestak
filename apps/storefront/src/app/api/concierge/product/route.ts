import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/concierge/product?id={product_id}
 *
 * Returns the product + its cheapest in-stock variant — everything
 * the voice cart needs to call useCartStore.addItem().
 */
export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from("products")
        .select(`
            id,
            name,
            brand,
            nav_category,
            slug,
            thumbnail_url,
            product_variants!inner (
                id,
                price_kes,
                stock_quantity
            )
        `)
        .eq("id", id)
        .eq("status", "published")
        .gt("product_variants.stock_quantity", 0)
        .order("price_kes", { referencedTable: "product_variants", ascending: true })
        .limit(1)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variants = Array.isArray(data.product_variants)
        ? data.product_variants
        : [data.product_variants];

    const variant = variants[0];
    if (!variant) {
        return NextResponse.json({ error: "No in-stock variant" }, { status: 404 });
    }

    return NextResponse.json({
        id: data.id,
        name: data.name,
        brand: data.brand,
        nav_category: data.nav_category,
        slug: data.slug,
        thumbnail_url: data.thumbnail_url,
        variant_id: variant.id,
        sell_price: variant.price_kes,
    });
}
