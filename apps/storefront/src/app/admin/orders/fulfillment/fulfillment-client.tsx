"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
    PageHeader, Card, Btn, Chip, T, Av
} from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    customer_email: string | null;
    status: string;
    payment_method: string | null;
    created_at: string;
    total_amount: number;
}

interface FulfillmentClientProps {
    initialOrders: Order[];
}

const stageOrder = ["pending", "processing", "packing", "shipped"];
const stageLabels: Record<string, string> = {
    pending: "New Orders",
    processing: "Processing",
    packing: "Packing",
    shipped: "Shipped Today"
};

const fmt = (val: number) => `KES ${Number(val).toLocaleString()}`;

export default function FulfillmentClient({ initialOrders }: FulfillmentClientProps) {
    const [orders] = useState(initialOrders);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Fulfillment" sub="Order pipeline from procurement to delivery" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                {stageOrder.map(stage => {
                    const count = orders.filter(o => o.status === stage).length;
                    return (
                        <Card key={stage} style={{ padding: "16px 18px" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
                                {stageLabels[stage]}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: count > 0 ? T.text : T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                                {count}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Active Orders</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>Sorted by urgency</div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    {orders.length === 0 ? (
                        <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>No active orders in fulfillment pipeline.</div>
                    ) : (
                        orders.map((o, i) => (
                            <div key={o.id} className="hover-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderBottom: i < orders.length - 1 ? `1px solid ${T.bg}` : "" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.blue, fontFamily: "'JetBrains Mono',monospace" }}>#{o.id.substring(0, 8)}</span>
                                        <Chip s={o.status} label={o.status.toUpperCase()} />
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{o.customer_name || "Guest User"}</div>
                                    <div style={{ fontSize: 11, color: T.textMuted }}>{o.customer_email || "No email provided"}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Payment</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{o.payment_method?.toUpperCase()}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Created</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{new Date(o.created_at).toLocaleDateString()}</div>
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: T.text, fontSize: 13, width: 120, textAlign: "right" }}>{fmt(o.total_amount)}</div>
                                <Btn small variant="ghost">Advance <ChevronRight size={14} style={{ marginLeft: 4 }} /></Btn>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
