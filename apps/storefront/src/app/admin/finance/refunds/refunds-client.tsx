"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD, Chip } from "@/components/admin/ui-pro";

interface Refund {
    id: string;
    refund_amount: number;
    reason: string | null;
    return_reason: string | null;
    status: string;
    orders?: {
        customer_name: string | null;
        total_amount: number;
    } | null;
}

interface RefundsClientProps {
    initialRefunds: Refund[];
    initialStats: {
        count: number;
        volume: number;
    };
}

const fmt = (n: number) => `$${Number(n).toLocaleString()}`;

export default function RefundsClient({ initialRefunds, initialStats }: RefundsClientProps) {
    const [refunds] = useState(initialRefunds);
    const [stats] = useState(initialStats);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Refund Management" sub="Reverse payments and reimbursements" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Refunds" value={String(stats.count)} iconChar="↩" color={T.red} sub="All time" />
                <StatCard label="Refund Volume" value={fmt(stats.volume)} iconChar="◆" color={T.orange} sub="Total value" />
                <StatCard label="Settlement" value="1.2d" iconChar="⊙" color={T.blue} sub="Avg processing time" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr 1fr 1fr 0.8fr" }}>
                    {["Refund ID", "Customer", "Amount", "Reason", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {refunds.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>No refunds on record.</div>
                    ) : refunds.map((r, i) => [
                        <TD key={`id${i}`}><span style={{ color: T.red, fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, fontWeight: 700 }}>#{r.id?.slice(0, 8)}</span></TD>,
                        <TD key={`cu${i}`} muted>{r.orders?.customer_name || "—"}</TD>,
                        <TD key={`am${i}`} mono color={T.orange}>{fmt(r.refund_amount || r.orders?.total_amount || 0)}</TD>,
                        <TD key={`re${i}`} muted>{r.reason || r.return_reason || "—"}</TD>,
                        <TD key={`st${i}`}><Chip s={r.status || "pending"} /></TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
