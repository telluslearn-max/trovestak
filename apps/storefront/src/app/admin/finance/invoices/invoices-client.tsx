"use client";

import React, { useState } from "react";
import { Card, Btn, TH, TD, T, PageHeader, Chip, Av } from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    total_amount: number;
    status: string;
    created_at: string;
}

interface InvoicesClientProps {
    initialOrders: Order[];
}

const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoicesClient({ initialOrders }: InvoicesClientProps) {
    const [orders] = useState(initialOrders);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Invoices" sub="Customer billing records">
                <Btn>Generate Invoice</Btn>
            </PageHeader>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr" }}>
                    {["Invoice", "Customer", "Amount", "Date", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {orders.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>No invoices found.</div>
                    ) : orders.map((o, i) => [
                        <TD key={`id${i}`}><span style={{ color: T.blue, fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, fontSize: 11 }}>#INV-{String(8800 + i).padStart(4, "0")}</span></TD>,
                        <TD key={`cu${i}`}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <Av l={(o.customer_name || "U")[0]} size={24} />
                                <span style={{ fontSize: 12 }}>{o.customer_name || "Unknown"}</span>
                            </div>
                        </TD>,
                        <TD key={`am${i}`} mono color={T.green}>{fmt(o.total_amount || 0)}</TD>,
                        <TD key={`dt${i}`} muted>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TD>,
                        <TD key={`st${i}`}><Chip s={o.status === "delivered" ? "completed" : o.status || "pending"} /></TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
