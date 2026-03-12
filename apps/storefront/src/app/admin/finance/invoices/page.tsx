import { createSupabaseServerClient } from "@/lib/supabase-server";
import InvoicesClient from "./invoices-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Invoices | Trovestak Admin",
    description: "Customer billing records.",
};

export default async function FinanceInvoicesPage() {
    const supabase = await createSupabaseServerClient();

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, customer_name, total_amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching orders for invoices:", error);
    }

    return (
        <InvoicesClient initialOrders={orders || []} />
    );
}
