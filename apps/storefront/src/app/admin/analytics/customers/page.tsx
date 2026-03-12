import { createSupabaseServerClient } from "@/lib/supabase-server";
import CustomerAnalyticsClient from "./customer-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer Analytics | Trovestak Admin",
    description: "Behavioral segmentation and value analysis.",
};

export default async function AdminCustomerAnalyticsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: allCustomers, count, error } = await supabase
        .from("customers")
        .select("id, full_name, email, total_spent, created_at, order_count", { count: "exact" })
        .order("total_spent", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching customer data:", error);
    }

    const customers = allCustomers || [];
    const now = new Date();
    const thisMonth = customers.filter((c: any) => {
        const d = new Date(c.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const totalSpent = customers.reduce((a: number, c: any) => a + (c.total_spent || 0), 0);
    const stats = {
        total: count || customers.length,
        newThisMonth: thisMonth,
        avgLtv: customers.length ? Math.round(totalSpent / customers.length) : 0
    };

    return (
        <CustomerAnalyticsClient
            initialCustomers={customers.slice(0, 20)}
            stats={stats}
        />
    );
}
