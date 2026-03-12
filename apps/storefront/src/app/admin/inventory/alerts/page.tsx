import { createSupabaseServerClient } from "@/lib/supabase-server";
import AlertsClient from "./alerts-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Low Stock Alerts | Trovestak Admin",
    description: "Supply risk analysis and inventory depletion warnings.",
};

export default async function LowStockAlertsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch products where stock is low (threshold of 15 for now)
    const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity")
        .lte("stock_quantity", 15)
        .order("stock_quantity", { ascending: true });

    if (error) {
        console.error("Error fetching low stock alerts:", error);
    }

    return (
        <AlertsClient initialLowStock={data || []} />
    );
}
