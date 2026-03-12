"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD, Chip } from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    status: string;
    shipping_tracking_id: string | null;
    created_at: string;
    shipping_address: any;
}

interface ShippingTrackingClientProps {
    initialOrders: Order[];
    stats: {
        inTransit: number;
        pending: number;
        delivered: number;
    };
}

export default function ShippingTrackingClient({ initialOrders, stats }: ShippingTrackingClientProps) {
    const [orders] = useState(initialOrders);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Global Tracking" sub="Real-time shipment monitoring" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="In Transit" value={String(stats.inTransit)} iconChar="🚚" color={T.blue} sub="Active shipments" />
                <StatCard label="Pending Pickup" value={String(stats.pending)} iconChar="📦" color={T.orange} sub="Awaiting carrier" />
                <StatCard label="Avg. TTD" value="3.2d" iconChar="⊙" color={T.green} sub="Time to delivery" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr 1fr 1fr 0.8fr" }}>
                    {["Order ID", "Customer", "Tracking #", "Status", "Date"].map(h => <TH key={h}>{h}</TH>)}
                    {orders.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>No active shipments.</div>
                    ) : orders.map((o, i) => [
                        <TD key={`id${i}`}><span style={{ color: T.cyan, fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, fontWeight: 700 }}>#{o.id.slice(0, 8)}</span></TD>,
                        <TD key={`cu${i}`} muted>{o.customer_name || "—"}</TD>,
                        <TD key={`tr${i}`}>
                            {o.shipping_tracking_id
                                ? <span style={{ fontSize: 11, fontFamily: "var(--font-jetbrains), monospace", color: T.blue, fontWeight: 600 }}>{o.shipping_tracking_id}</span>
                                : <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
                            }
                        </TD>,
                        <TD key={`st${i}`}><Chip s={o.status} /></TD>,
                        <TD key={`dt${i}`} muted>
                            {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
