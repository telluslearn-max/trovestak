import { createSupabaseServerClient } from "@/lib/supabase-server";
import RefundsClient from "./refunds-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Refund Management | Trovestak Admin",
    description: "Reverse payments and reimbursements.",
};

export default async function FinanceRefundsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: refunds, error } = await supabase
        .from("order_returns")
        .select("*, orders(customer_name, total_amount)")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching refunds:", error);
    }

    const rows = refunds || [];
    const volume = rows.reduce((a, r) => a + (r.refund_amount || r.orders?.total_amount || 0), 0);

    return (
        <RefundsClient
            initialRefunds={rows}
            initialStats={{ count: rows.length, volume }}
        />
    );
}
