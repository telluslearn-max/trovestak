import { createSupabaseServerClient } from "@/lib/supabase-server";
import InventoryClient from "./inventory-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inventory Dashboard | Trovestak Admin",
    description: "Unified control center for Procurement, Inventory Provenance, and Reverse Logistics.",
};

export default async function InventoryDashboard() {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch Basic Stock Stats
    const { data: stockData } = await supabase
        .from("products")
        .select("stock_quantity, cost_price");

    // 2. Fetch Active POs
    const { count: poCount } = await supabase
        .from("procurement_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["ordered", "partially_received"]);

    // 3. Fetch Pending Trade-ins
    const { count: tradeInCount } = await supabase
        .from("trade_ins")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    // 4. Fetch Unassigned Units (Sourced but not sold)
    const { count: unitCount } = await supabase
        .from("inventory_units")
        .select("*", { count: "exact", head: true })
        .eq("status", "available");

    // Process Stock Stats
    let low = 0;
    let out = 0;
    let val = 0;
    stockData?.forEach((p) => {
        if (p.stock_quantity === 0) out++;
        else if (p.stock_quantity <= 10) low++;
        val += (p.stock_quantity || 0) * (p.cost_price || 0);
    });

    const stats = {
        totalProducts: stockData?.length || 0,
        lowStock: low,
        outOfStock: out,
        activePOs: poCount || 0,
        pendingTradeIns: tradeInCount || 0,
        unassignedUnits: unitCount || 0,
        inventoryValue: val,
    };

    return <InventoryClient initialStats={stats} />;
}
