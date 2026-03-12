"use client";

import React from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

const SEGMENTS = [
    { name: "High-Value Customers", size: 842, ltv: 4200, retention: "91%", color: T.purple, desc: "Spent $1k+ in last 90 days" },
    { name: "Loyal Regulars", size: 2140, ltv: 980, retention: "78%", color: T.blue, desc: "3+ orders in last 6 months" },
    { name: "At-Risk Churners", size: 630, ltv: 540, retention: "24%", color: T.red, desc: "No order in last 60 days" },
    { name: "New Acquisitions", size: 1284, ltv: 120, retention: "N/A", color: T.green, desc: "First order within last 30 days" },
    { name: "Dormant", size: 3400, ltv: 210, retention: "8%", color: T.textMuted, desc: "No activity in 180+ days" },
    { name: "VIP Members", size: 214, ltv: 12400, retention: "97%", color: T.orange, desc: "Loyalty Platinum tier" },
];

export default function CustomerSegmentsPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Customer Segments" sub="Behavioral clustering and cohort analysis">
                <Btn>+ Create Segment</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {SEGMENTS.map(seg => (
                    <Card key={seg.name} style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{seg.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{seg.desc}</div>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: seg.color, fontFamily: "var(--font-jetbrains), monospace" }}>
                                {seg.size.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ background: T.surface, borderRadius: 8, padding: "10px 12px" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Avg. LTV</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: seg.color, fontFamily: "var(--font-jetbrains), monospace" }}>${seg.ltv.toLocaleString()}</div>
                            </div>
                            <div style={{ background: T.surface, borderRadius: 8, padding: "10px 12px" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Retention</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>{seg.retention}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                            <Btn small variant="ghost">View Members</Btn>
                            <Btn small variant="ghost">Campaign</Btn>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
