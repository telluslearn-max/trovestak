"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD, Chip } from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    total_amount: number | null;
    status: string | null;
    created_at: string;
}

interface RevenueAnalyticsClientProps {
    initialOrders: Order[];
    stats: {
        gross: number;
        count: number;
        aov: number;
    };
}

const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function RevenueAnalyticsClient({ initialOrders, stats }: RevenueAnalyticsClientProps) {
    const [orders] = useState(initialOrders);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Revenue Analytics" sub="Fiscal performance and margin analysis" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Gross Revenue" value={fmt(stats.gross)} iconChar="◆" color={T.green} sub="All orders" />
                <StatCard label="Total Orders" value={String(stats.count)} iconChar="◉" color={T.blue} sub="In dataset" />
                <StatCard label="Avg. AOV" value={fmt(stats.aov)} iconChar="◈" color={T.purple} sub="Per order" />
            </div>

            <Card>
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Top Revenue Orders</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr 1fr 0.8fr" }}>
                    {["Order ID", "Customer", "Amount", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {orders.length === 0 ? (
                        <div style={{ gridColumn: "span 4", padding: 40, textAlign: "center", color: T.textMuted }}>No orders found.</div>
                    ) : orders.map((o, i) => [
                        <TD key={`id${i}`}><span style={{ color: T.cyan, fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, fontWeight: 700 }}>#{o.id.slice(0, 8)}</span></TD>,
                        <TD key={`cu${i}`} muted>{o.customer_name || "—"}</TD>,
                        <TD key={`am${i}`} mono color={T.green}>{fmt(o.total_amount || 0)}</TD>,
                        <TD key={`st${i}`}><Chip s={o.status || "pending"} /></TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
