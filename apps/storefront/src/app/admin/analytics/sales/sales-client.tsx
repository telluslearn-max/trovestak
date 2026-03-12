"use client";

import React, { useState } from "react";
import { StatCard, Card, Btn, T, PageHeader, TH, TD, Chip } from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    total_amount: number | null;
    status: string | null;
    created_at: string;
}

interface SalesReportsClientProps {
    initialOrders: Order[];
    stats: {
        total: number;
        count: number;
        aov: number;
    };
}

const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function SalesReportsClient({ initialOrders, stats }: SalesReportsClientProps) {
    const [orders] = useState(initialOrders);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Sales Reports" sub="Comprehensive sales performance reporting">
                <Btn variant="ghost">Export CSV</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Sales" value={fmt(stats.total)} iconChar="◆" color={T.blue} sub="Delivered orders" />
                <StatCard label="Orders Count" value={String(stats.count)} iconChar="◉" color={T.green} sub="Completed" />
                <StatCard label="Avg. AOV" value={fmt(stats.aov)} iconChar="◈" color={T.purple} sub="Per order" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr 1fr 1fr 0.8fr" }}>
                    {["Order ID", "Customer", "Amount", "Date", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {orders.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: 40, textAlign: "center", color: T.textMuted }}>No completed sales.</div>
                    ) : orders.map((o, i) => [
                        <TD key={`id${i}`}><span style={{ color: T.cyan, fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, fontWeight: 700 }}>#{o.id.slice(0, 8)}</span></TD>,
                        <TD key={`cu${i}`} muted>{o.customer_name || "—"}</TD>,
                        <TD key={`am${i}`} mono color={T.green}>{fmt(o.total_amount || 0)}</TD>,
                        <TD key={`dt${i}`} muted>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TD>,
                        <TD key={`st${i}`}><Chip s={o.status || "delivered"} /></TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
