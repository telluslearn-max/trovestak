import { Metadata } from "next";
import TransactionsClient from "./transactions-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
    title: "Transactions | Trovestak Admin",
    description: "All payment records.",
};

export default async function FinanceTransactionsPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_phone, total_amount, payment_method, payment_status, mpesa_receipt_number, created_at")
        .not("payment_status", "eq", "awaiting_payment")
        .order("created_at", { ascending: false })
        .limit(200);

    if (error) console.error("Error fetching transactions:", error);

    const rows = (data || []) as any[];
    const paid = rows.filter(r => r.payment_status === "paid");
    const total = paid.reduce((s: number, r: any) => s + (r.total_amount || 0), 0);
    const mpesa = paid.filter((r: any) => r.payment_method === "mpesa").reduce((s: number, r: any) => s + (r.total_amount || 0), 0);
    const other = total - mpesa;

    return (
        <TransactionsClient
            initialTransactions={rows}
            initialStats={{ total, mpesa, other }}
        />
    );
}
