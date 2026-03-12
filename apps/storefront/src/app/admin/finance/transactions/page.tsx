import { createSupabaseServerClient } from "@/lib/supabase-server";
import TransactionsClient from "./transactions-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transactions | Trovestak Admin",
    description: "All payment records.",
};

export default async function FinanceTransactionsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: transactions, error } = await supabase
        .from("payments")
        .select("*, orders(id, customer_name)")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching transactions:", error);
    }

    const rows = transactions || [];
    const total = rows.reduce((a, t) => a + (t.amount || 0), 0);
    const mpesa = rows.filter((t) => t.payment_method === "mpesa").reduce((a, t) => a + (t.amount || 0), 0);
    const card = rows.filter((t) => t.payment_method !== "mpesa").reduce((a, t) => a + (t.amount || 0), 0);

    return (
        <TransactionsClient
            initialTransactions={rows}
            initialStats={{ total, mpesa, card }}
        />
    );
}
