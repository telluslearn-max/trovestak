"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD, Av } from "@/components/admin/ui-pro";

interface Customer {
    id: string;
    full_name: string | null;
    email: string;
    total_spent: number | null;
    order_count: number | null;
    created_at: string;
}

interface CustomerAnalyticsClientProps {
    initialCustomers: Customer[];
    stats: {
        total: number;
        newThisMonth: number;
        avgLtv: number;
    };
}

const fmt = (n: number) => `$${Number(n).toLocaleString()}`;

export default function CustomerAnalyticsClient({ initialCustomers, stats }: CustomerAnalyticsClientProps) {
    const [customers] = useState(initialCustomers);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Customer Analytics" sub="Behavioral segmentation and value analysis" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Customers" value={String(stats.total)} iconChar="◉" color={T.blue} sub="All time" />
                <StatCard label="New This Month" value={String(stats.newThisMonth)} iconChar="↗" color={T.green} sub="Acquisitions" />
                <StatCard label="Avg. LTV" value={fmt(stats.avgLtv)} iconChar="◈" color={T.purple} sub="Lifetime value" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr" }}>
                    {["Customer", "Total Spent", "Orders", "Joined"].map(h => <TH key={h}>{h}</TH>)}
                    {customers.length === 0 ? (
                        <div style={{ gridColumn: "span 4", padding: 40, textAlign: "center", color: T.textMuted }}>No customers found.</div>
                    ) : customers.map((c, i) => [
                        <TD key={`n${i}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Av l={(c.full_name || c.email || "U")[0]} size={26} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.full_name || "—"}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{c.email}</div>
                                </div>
                            </div>
                        </TD>,
                        <TD key={`sp${i}`} mono color={T.green}>{fmt(c.total_spent || 0)}</TD>,
                        <TD key={`or${i}`} mono>{c.order_count || 0}</TD>,
                        <TD key={`jo${i}`} muted>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
