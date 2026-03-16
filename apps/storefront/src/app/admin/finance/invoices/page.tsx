import { Metadata } from "next";
import InvoicesClient from "./invoices-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
    title: "Invoices | Trovestak Admin",
    description: "Customer billing records.",
};

export default async function FinanceInvoicesPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_phone, total_amount, payment_status, payment_method, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

    if (error) console.error("Error fetching orders for invoices:", error);

    return <InvoicesClient initialOrders={(data || []) as any[]} />;
}
