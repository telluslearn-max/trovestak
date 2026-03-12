"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD, Chip, Btn } from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    items_count: number | null;
}

interface PendingOrdersClientProps {
    initialOrders: Order[];
}

const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const getWaitHours = (created_at: string) => {
    const hours = Math.round((Date.now() - new Date(created_at).getTime()) / 3600000);
    return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
};

export default function PendingOrdersClient({ initialOrders }: PendingOrdersClientProps) {
    const [orders] = useState(initialOrders);

    const overdue = orders.filter(o => (Date.now() - new Date(o.created_at).getTime()) > 2 * 3600000).length;

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Pending Orders" sub="High-priority queue for immediate processing" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Pending Orders" value={String(orders.length)} iconChar="⏳" color={T.orange} sub="Awaiting action" />
                <StatCard label="Overdue (&gt;2h)" value={String(overdue)} iconChar="⚠" color={T.red} sub="Need immediate action" />
                <StatCard label="Avg. Wait" value={orders.length ? getWaitHours(orders[0]?.created_at || new Date().toISOString()) : "—"} iconChar="⊙" color={T.blue} sub="Oldest order" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr 1fr 0.8fr 0.8fr 100px" }}>
                    {["Order ID", "Customer", "Amount", "Waiting", "Items", "Action"].map(h => <TH key={h}>{h}</TH>)}
                    {orders.length === 0 ? (
                        <div style={{ gridColumn: "span 6", padding: 40, textAlign: "center", color: T.green }}>No pending orders ✓</div>
                    ) : orders.map((o, i) => {
                        const wait = (Date.now() - new Date(o.created_at).getTime()) / 3600000;
                        const isUrgent = wait > 2;
                        return [
                            <TD key={`id${i}`}><span style={{ color: isUrgent ? T.orange : T.cyan, fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, fontWeight: 700 }}>#{o.id.slice(0, 8)}</span></TD>,
                            <TD key={`cu${i}`} muted>{o.customer_name || "Unknown"}</TD>,
                            <TD key={`am${i}`} mono color={T.green}>{fmt(o.total_amount || 0)}</TD>,
                            <TD key={`wt${i}`}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isUrgent ? T.red : T.orange, fontFamily: "var(--font-jetbrains), monospace" }}>
                                    {getWaitHours(o.created_at)}
                                </span>
                            </TD>,
                            <TD key={`it${i}`} mono>{o.items_count || "—"}</TD>,
                            <TD key={`ac${i}`}><Btn small>Process</Btn></TD>,
                        ];
                    })}
                </div>
            </Card>
        </div>
    );
}
