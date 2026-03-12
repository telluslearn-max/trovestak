"use client";

import React from "react";
import { StatCard, Card, T, PageHeader } from "@/components/admin/ui-pro";

interface Campaign {
    name: string;
    status: string;
    recipients: number;
    opens: number;
    clicks: number;
    date: string;
}

interface EmailCampaignsClientProps {
    campaigns: Campaign[];
    stats: {
        totalSubscribers: string;
        avgOpenRate: string;
        avgCTR: string;
    };
}

export default function EmailCampaignsClient({ campaigns, stats }: EmailCampaignsClientProps) {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Email Campaigns" sub="Direct communications with your customer base" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Subscribers" value={stats.totalSubscribers} iconChar="◉" color={T.blue} sub="Active list" />
                <StatCard label="Avg Open Rate" value={stats.avgOpenRate} iconChar="↗" color={T.green} sub="Last 30 days" />
                <StatCard label="Avg CTR" value={stats.avgCTR} iconChar="◈" color={T.purple} sub="Click-through rate" />
            </div>

            <Card>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {campaigns.map((c, i) => (
                        <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", borderBottom: i < campaigns.length - 1 ? `1px solid ${T.border}` : "" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{c.date}</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>Recipients</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>{c.recipients.toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>Opens</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: c.opens > 0 ? T.green : T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>
                                    {c.opens > 0 ? `${((c.opens / c.recipients) * 100).toFixed(1)}%` : "—"}
                                </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>Clicks</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: c.clicks > 0 ? T.cyan : T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>
                                    {c.clicks > 0 ? `${((c.clicks / c.recipients) * 100).toFixed(1)}%` : "—"}
                                </div>
                            </div>
                            <span style={{
                                fontSize: 10, padding: "3px 9px", borderRadius: 5,
                                background: c.status === "Sent" ? T.green + "20" : c.status === "Scheduled" ? T.blue + "20" : T.surface,
                                color: c.status === "Sent" ? T.green : c.status === "Scheduled" ? T.blue : T.textMuted,
                                fontWeight: 700
                            }}>{c.status}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
