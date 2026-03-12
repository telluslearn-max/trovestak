import { createSupabaseServerClient } from "@/lib/supabase-server";
import CancellationsClient from "./cancellations-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cancellations | Trovestak Admin",
    description: "Cancelled orders tracked this period.",
};

export default async function AdminCancellationsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: cancelledOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "cancelled")
        .order("updated_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching cancelled orders:", error);
    }

    return (
        <CancellationsClient initialCancelledOrders={cancelledOrders || []} />
    );
}
