"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, Clock, CheckCircle2, Filter, Search, ChevronRight, LayoutGrid, MoreVertical } from "lucide-react";
import {
    PageHeader, Card, StatCard, Btn, Chip, T, Av, SInput, TH, TD
} from "@/components/admin/ui-pro";
import { toast } from "sonner";

export default function SupportTicketsPage() {
    const [filter, setFilter] = useState("All");
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const filters = ["All", "open", "in_progress", "resolved"];

    const stats = [
        { label: "Open Tickets", value: "0", icon: MessageCircle, color: T.red },
        { label: "Avg. Response", value: "0m", icon: Clock, color: T.orange },
        { label: "Resolution Rate", value: "100%", icon: CheckCircle2, color: T.green },
    ];

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1600, margin: "0 auto" }}>
            <PageHeader title="Support Tickets" sub="Customer success command center. Monitoring resolution efficiency." />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {stats.map(s => (
                    <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 6 }}>
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: "6px 14px",
                                borderRadius: 7,
                                border: `1px solid ${filter === f ? T.blue : T.border}`,
                                background: filter === f ? T.blue + "20" : "transparent",
                                color: filter === f ? T.blue : T.textSub,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "'Syne', sans-serif",
                                textTransform: "capitalize",
                                transition: "all 0.2s"
                            }}
                        >
                            {f.replace("_", " ")}
                        </button>
                    ))}
                </div>
                <div style={{ width: 280 }}>
                    <SInput placeholder="Search ticket vault..." icon={<Search size={14} />} />
                </div>
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 2fr 0.8fr 0.8fr" }}>
                    {["Ticket", "Customer", "Subject", "Priority", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {loading ? (
                        <div style={{ gridColumn: "span 5", padding: 80, textAlign: "center", color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                            QUERYING_INTERNAL_VAULT...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: 80, textAlign: "center", color: T.textMuted }}>
                            <div style={{ marginBottom: 12 }}><MessageCircle size={32} style={{ opacity: 0.2, margin: "0 auto" }} /></div>
                            No active tickets found in the support queue.
                        </div>
                    ) : (
                        tickets.map((t, i) => [
                            <TD key={`id${i}`}><span style={{ color: T.blue, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11 }}>#{t.id}</span></TD>,
                            <TD key={`cu${i}`}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><Av l={t.customer?.[0] || "?"} size={26} /><span style={{ fontSize: 12 }}>{t.customer}</span></div></TD>,
                            <TD key={`su${i}`} muted>{t.subject}</TD>,
                            <TD key={`pr${i}`}><Chip s={t.priority} /></TD>,
                            <TD key={`st${i}`}><Chip s={t.status} /></TD>,
                        ])
                    )}
                </div>
            </Card>
        </div>
    );
}
