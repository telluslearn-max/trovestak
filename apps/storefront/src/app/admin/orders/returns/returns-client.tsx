"use client";

import React, { useState } from "react";
import { PageHeader, Card, T, Av, TH, TD, Chip } from "@/components/admin/ui-pro";

interface ReturnsClientProps {
    initialReturns: any[];
}

export default function ReturnsClient({ initialReturns }: ReturnsClientProps) {
    const [returns] = useState(initialReturns);

    const kpis = [
        { label: "Open", count: 0, color: T.orange },
        { label: "Approved", count: 0, color: T.green },
        { label: "Rejected", count: 0, color: T.red },
        { label: "Refunded", count: 0, color: T.blue }
    ];

    const fmt = (val: number) => `KES ${Number(val).toLocaleString()}`;

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Returns & Refunds" sub={`${returns.length} return requests tracked this period`} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                {kpis.map(s => (
                    <Card key={s.label} style={{ padding: "18px 22px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>
                            {s.count}
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1.2fr 1.4fr 0.8fr 0.8fr" }}>
                    {["Return ID", "Order", "Customer", "Reason", "Amount", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {returns.length === 0 ? (
                        <div style={{ gridColumn: "span 6", padding: 60, textAlign: "center", color: T.textMuted }}>No active return requests found.</div>
                    ) : (
                        returns.map((r, i) => [
                            <TD key={`id${i}`}><span style={{ color: T.blue, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11 }}>#RET-{r.id.substring(0, 5)}</span></TD>,
                            <TD key={`or${i}`} mono muted>#{r.id.substring(0, 8)}</TD>,
                            <TD key={`cu${i}`}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av l={r.customer_name?.[0] || "?"} size={24} /><span style={{ fontSize: 12 }}>{r.customer_name || "Guest"}</span></div></TD>,
                            <TD key={`re${i}`} muted>{r.notes || "Not specified"}</TD>,
                            <TD key={`am${i}`} mono>{fmt(r.total_amount)}</TD>,
                            <TD key={`st${i}`}><Chip s="returned" label="RETURNED" /></TD>,
                        ])
                    )}
                </div>
            </Card>
        </div>
    );
}
