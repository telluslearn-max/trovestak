import { createSupabaseServerClient } from "@/lib/supabase-server";
import StockClient from "./stock-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stock Levels | Trovestak Admin",
    description: "Live inventory across all points of presence.",
};

export default async function InventoryStockPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, cost_price, nav_category")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching stock levels:", error);
    }

    return (
        <StockClient initialProducts={data || []} />
    );
}
