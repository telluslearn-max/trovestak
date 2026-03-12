"use client";

import React, { useState } from "react";
import { StatCard, Card, Btn, TH, TD, T, PageHeader, Chip } from "@/components/admin/ui-pro";

interface Payment {
    id: string;
    order_id: string;
    amount: number;
    payment_method: string;
    payment_reference: string | null;
    transaction_id: string | null;
    status: string;
    created_at: string;
    orders?: {
        id: string;
        customer_name: string | null;
    } | null;
}

interface TransactionsClientProps {
    initialTransactions: Payment[];
    initialStats: {
        total: number;
        mpesa: number;
        card: number;
    };
}

const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TransactionsClient({ initialTransactions, initialStats }: TransactionsClientProps) {
    const [transactions] = useState(initialTransactions);
    const [stats] = useState(initialStats);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Transactions" sub="All payment records">
                <Btn variant="ghost">Export</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Volume" value={`$${(stats.total / 1000).toFixed(1)}k`} iconChar="◆" color={T.green} sub="All time" />
                <StatCard label="M-Pesa" value={`$${(stats.mpesa / 1000).toFixed(1)}k`} iconChar="📱" color={T.green} sub="Mobile money" />
                <StatCard label="Card" value={`$${(stats.card / 1000).toFixed(1)}k`} iconChar="💳" color={T.blue} sub="Card payments" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 0.8fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr" }}>
                    {["Txn ID", "Order", "Customer", "Amount", "Method", "Reference", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {transactions.length === 0 ? (
                        <div style={{ gridColumn: "span 7", padding: "40px", textAlign: "center", color: T.textMuted }}>No transactions found.</div>
                    ) : transactions.map((t, i) => [
                        <TD key={`id${i}`}><span style={{ color: T.cyan, fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, fontSize: 10 }}>{t.id?.slice(0, 12)}...</span></TD>,
                        <TD key={`or${i}`} mono muted>{t.order_id?.slice(0, 8)}...</TD>,
                        <TD key={`cu${i}`} muted>{t.orders?.customer_name || "—"}</TD>,
                        <TD key={`am${i}`} mono color={T.green}>{fmt(t.amount || 0)}</TD>,
                        <TD key={`me${i}`}><span style={{ fontSize: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: "2px 7px", color: T.textSub }}>{t.payment_method || "Card"}</span></TD>,
                        <TD key={`re${i}`} mono muted>{t.payment_reference || t.transaction_id || "—"}</TD>,
                        <TD key={`st${i}`}><Chip s={t.status || "completed"} /></TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
