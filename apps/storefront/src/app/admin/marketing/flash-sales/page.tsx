import { createSupabaseServerClient } from "@/lib/supabase-server";
import FlashSalesClient from "./flash-sales-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Flash Sales | Trovestak Admin",
    description: "Urgency-driven, time-limited promotions.",
};

export default async function AdminFlashSalesPage() {
    const supabase = await createSupabaseServerClient();

    const { data: sales, error } = await supabase
        .from("flash_sales")
        .select("*")
        .order("starts_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching flash sales:", error);
    }

    return (
        <FlashSalesClient initialSales={sales || []} />
    );
}
