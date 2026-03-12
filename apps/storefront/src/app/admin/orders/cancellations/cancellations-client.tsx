"use client";

import React, { useState } from "react";
import {
    PageHeader, Card, Av, TH, TD, T
} from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    total_amount: number;
    notes: string | null;
    created_at: string;
}

interface CancellationsClientProps {
    initialCancelledOrders: Order[];
}

const fmt = (val: number) => `KES ${Number(val).toLocaleString()}`;

export default function CancellationsClient({ initialCancelledOrders }: CancellationsClientProps) {
    const [cancelledOrders] = useState(initialCancelledOrders);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Cancellations" sub={`${cancelledOrders.length} cancelled orders tracked this period`} />

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.4fr 0.8fr 0.8fr" }}>
                    {["Order", "Customer", "Product Info", "Amount", "Date"].map(h => <TH key={h}>{h}</TH>)}
                    {cancelledOrders.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: 60, textAlign: "center", color: T.textMuted }}>No cancelled orders found in this period.</div>
                    ) : (
                        cancelledOrders.map((o, i) => [
                            <TD key={`id${i}`}><span style={{ color: T.red, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11 }}>#{o.id.substring(0, 8)}</span></TD>,
                            <TD key={`cu${i}`}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><Av l={o.customer_name?.[0] || "?"} size={26} /><span style={{ fontSize: 12 }}>{o.customer_name || "Guest"}</span></div></TD>,
                            <TD key={`pr${i}`} muted>{o.notes || "Standard Order"}</TD>,
                            <TD key={`am${i}`} mono>{fmt(o.total_amount)}</TD>,
                            <TD key={`dt${i}`} muted>{new Date(o.created_at).toLocaleDateString()}</TD>,
                        ])
                    )}
                </div>
            </Card>
        </div>
    );
}
