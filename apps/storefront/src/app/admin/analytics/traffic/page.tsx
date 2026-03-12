"use client";

import React from "react";
import { StatCard, Card, T, PageHeader } from "@/components/admin/ui-pro";

const TRAFFIC_DATA = [
    { source: "Organic Search", visits: 14420, pct: 42, color: T.green },
    { source: "Direct", visits: 8240, pct: 24, color: T.blue },
    { source: "Social Media", visits: 5140, pct: 15, color: T.pink },
    { source: "Email Campaigns", visits: 3430, pct: 10, color: T.cyan },
    { source: "Referral", visits: 2060, pct: 6, color: T.purple },
    { source: "Paid Ads", visits: 1030, pct: 3, color: T.orange },
];

export default function TrafficAnalyticsPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Traffic Analytics" sub="Visitor acquisition and engagement metrics" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Visitors" value="34.3k" iconChar="◉" color={T.blue} sub="This month" />
                <StatCard label="Bounce Rate" value="38.2%" iconChar="↩" color={T.orange} sub="-2.1% vs last month" />
                <StatCard label="Avg. Session" value="3m 42s" iconChar="⊙" color={T.cyan} sub="Time on site" />
            </div>

            <Card>
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Traffic Sources</div>
                </div>
                {TRAFFIC_DATA.map((s, i) => (
                    <div key={s.source} style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "16px 22px",
                        borderBottom: i < TRAFFIC_DATA.length - 1 ? `1px solid ${T.border}` : ""
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text }}>{s.source}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "var(--font-jetbrains), monospace", width: 64, textAlign: "right" }}>
                            {s.visits.toLocaleString()}
                        </div>
                        <div style={{ width: 140 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 10, color: T.textMuted }}>{s.pct}%</span>
                            </div>
                            <div style={{ height: 4, background: T.border, borderRadius: 4 }}>
                                <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 4 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
}
