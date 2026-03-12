import { createSupabaseServerClient } from "@/lib/supabase-server";
import RevenueAnalyticsClient from "./revenue-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Revenue Analytics | Trovestak Admin",
    description: "Fiscal performance and margin analysis.",
};

export default async function AdminRevenueAnalyticsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: allOrders, error } = await supabase
        .from("orders")
        .select("id, customer_name, total_amount, status, created_at")
        .order("total_amount", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching revenue data:", error);
    }

    const orders = allOrders || [];
    const gross = orders.reduce((a: number, o: any) => a + (o.total_amount || 0), 0);
    const stats = {
        gross,
        count: orders.length,
        aov: orders.length ? Math.round(gross / orders.length) : 0
    };

    return (
        <RevenueAnalyticsClient
            initialOrders={orders.slice(0, 20)}
            stats={stats}
        />
    );
}
