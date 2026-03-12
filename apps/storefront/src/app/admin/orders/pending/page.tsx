import { createSupabaseServerClient } from "@/lib/supabase-server";
import PendingOrdersClient from "./pending-orders-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pending Orders | Trovestak Admin",
    description: "High-priority queue for immediate processing.",
};

export default async function AdminPendingOrdersPage() {
    const supabase = await createSupabaseServerClient();

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, customer_name, total_amount, status, created_at, items_count")
        .eq("status", "pending")
        .order("created_at", { ascending: true }) // oldest first (most urgent)
        .limit(100);

    if (error) {
        console.error("Error fetching pending orders:", error);
    }

    return (
        <PendingOrdersClient initialOrders={orders || []} />
    );
}
