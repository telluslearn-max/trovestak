import { Metadata } from "next";
import TradeInsClient from "./trade-ins-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
    title: "Trade-in Intake | Trovestak Admin",
    description: "Reverse supply chain management and valuations.",
};

export default async function TradeInsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: tradeIns, error } = await supabase
        .from("trade_ins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) console.error("Error fetching trade-ins:", error);

    return <TradeInsClient initialTradeIns={(tradeIns || []) as any[]} />;
}
