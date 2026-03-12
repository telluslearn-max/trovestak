import { createSupabaseServerClient } from "@/lib/supabase-server";
import PurchaseOrdersClient from "./purchase-orders-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Purchase Orders | Trovestak Admin",
    description: "Track official procurement cycles with suppliers.",
};

export default async function PurchaseOrdersPage() {
    const supabase = await createSupabaseServerClient();

    const { data: orders, error } = await supabase
        .from("procurement_orders")
        .select("*, supplier:supplier(name, display_name)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching purchase orders:", error);
    }

    return (
        <PurchaseOrdersClient initialOrders={orders || []} />
    );
}
