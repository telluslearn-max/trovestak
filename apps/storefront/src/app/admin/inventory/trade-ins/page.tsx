import { createSupabaseServerClient } from "@/lib/supabase-server";
import TradeInsClient from "./trade-ins-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trade-in Intake | Trovestak Admin",
    description: "Reverse supply chain management and valuations.",
};

export default async function TradeInsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch trade-ins with customer profile data
    const { data: tradeIns, error: tradeInError } = await supabase
        .from("trade_ins")
        .select("*, customer:profiles(full_name, email)")
        .order("created_at", { ascending: false });

    if (tradeInError) {
        console.error("Error fetching trade-ins:", tradeInError);
    }

    // Fetch recent customers for intake form
    const { data: customers, error: customerError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .limit(20);

    if (customerError) {
        console.error("Error fetching customers for trade-ins:", customerError);
    }

    return (
        <TradeInsClient
            initialTradeIns={tradeIns || []}
            customers={customers || []}
        />
    );
}
