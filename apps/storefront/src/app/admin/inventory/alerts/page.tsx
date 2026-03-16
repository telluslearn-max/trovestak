import { Metadata } from "next";
import AlertsClient from "./alerts-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
    title: "Low Stock Alerts | Trovestak Admin",
    description: "Supply risk analysis and inventory depletion warnings.",
};

export default async function LowStockAlertsPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, low_stock_threshold, nav_category, status")
        .lte("stock_quantity", 20)
        .eq("status", "published")
        .order("stock_quantity", { ascending: true })
        .limit(100);

    if (error) console.error("Error fetching low stock alerts:", error);

    return <AlertsClient initialLowStock={(data || []) as any[]} />;
}
