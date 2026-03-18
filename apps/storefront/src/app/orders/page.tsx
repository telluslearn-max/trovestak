import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import OrdersClient from "./orders-client";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Order History | Trovestak",
    description: "Detailed chronological history of your equipment deployments and transactions.",
};

export default async function OrdersPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in?returnTo=/orders");
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            unit_price
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching orders:", error);
    }

    return (
        <OrdersClient initialOrders={orders || []} />
    );
}
