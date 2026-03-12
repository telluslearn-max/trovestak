import { createSupabaseServerClient } from "@/lib/supabase-server";
import SalesReportsClient from "./sales-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sales Reports | Trovestak Admin",
    description: "Comprehensive sales performance reporting.",
};

export default async function AdminSalesReportsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: allOrders, error } = await supabase
        .from("orders")
        .select("id, customer_name, total_amount, status, created_at")
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching sales data:", error);
    }

    const orders = allOrders || [];
    const total = orders.reduce((a: number, o: any) => a + (o.total_amount || 0), 0);
    const stats = {
        total,
        count: orders.length,
        aov: orders.length ? Math.round(total / orders.length) : 0
    };

    return (
        <SalesReportsClient
            initialOrders={orders.slice(0, 30)}
            stats={stats}
        />
    );
}
