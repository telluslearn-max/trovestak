import { createSupabaseServerClient } from "@/lib/supabase-server";
import ReturnsClient from "./returns-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Returns & Refunds | Trovestak Admin",
    description: "Manage reverse logistics and customer refund requests.",
};

export default async function ReturnsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch orders with a 'returned' status
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "returned")
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching returns:", error);
    }

    return (
        <ReturnsClient initialReturns={data || []} />
    );
}
