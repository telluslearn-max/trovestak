import { createSupabaseServerClient } from "@/lib/supabase-server";
import ProductAnalyticsClient from "./product-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Product Analytics | Trovestak Admin",
    description: "Performance metrics by product.",
};

export default async function AdminProductAnalyticsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: allProducts, error } = await supabase
        .from("products")
        .select("id, name, sku, price, stock_quantity, category")
        .order("price", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching product data:", error);
    }

    const products = allProducts || [];
    const avgP = products.length ? products.reduce((a: number, p: any) => a + (p.price || 0), 0) / products.length : 0;
    const topR = products.length ? (products[0].price || 0) * (products[0].stock_quantity || 0) : 0;

    const stats = {
        total: products.length,
        avgPrice: Math.round(avgP),
        topRevenue: topR
    };

    return (
        <ProductAnalyticsClient
            initialProducts={products.slice(0, 20)}
            stats={stats}
        />
    );
}
