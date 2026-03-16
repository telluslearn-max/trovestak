import { Metadata } from "next";
import TrafficClient from "./traffic-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
    title: "Delivery Heatmap | Trovestak Admin",
    description: "Order distribution by Kenya county.",
};

export interface CountyData {
    county: string;
    orders: number;
    revenue: number;
}

export default async function TrafficAnalyticsPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select("shipping_address, total_amount, payment_status")
        .eq("payment_status", "paid");

    if (error) console.error("Error fetching orders for heatmap:", error);

    // Aggregate by county
    const countyMap: Record<string, { orders: number; revenue: number }> = {};
    for (const row of (data || [])) {
        const addr = row.shipping_address as Record<string, string> | null;
        const county = addr?.county?.trim() || addr?.city?.trim() || "Unknown";
        if (!countyMap[county]) countyMap[county] = { orders: 0, revenue: 0 };
        countyMap[county].orders += 1;
        countyMap[county].revenue += row.total_amount || 0;
    }

    const countyData: CountyData[] = Object.entries(countyMap)
        .map(([county, v]) => ({ county, orders: v.orders, revenue: v.revenue }))
        .sort((a, b) => b.orders - a.orders);

    const totalOrders = countyData.reduce((s, c) => s + c.orders, 0);
    const totalRevenue = countyData.reduce((s, c) => s + c.revenue, 0);

    return (
        <TrafficClient
            countyData={countyData}
            totalOrders={totalOrders}
            totalRevenue={totalRevenue}
        />
    );
}
