"use client";

import React, { useState } from "react";
import { StatCard, Card, Btn, T, PageHeader, Chip } from "@/components/admin/ui-pro";

interface FlashSale {
    id: string;
    name: string | null;
    title: string | null;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    discount_percentage: number | null;
}

interface FlashSalesClientProps {
    initialSales: FlashSale[];
}

export default function FlashSalesClient({ initialSales }: FlashSalesClientProps) {
    const [sales] = useState(initialSales);
    const active = sales.filter(s => s.status === "active").length;

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Flash Sales" sub="Urgency-driven, time-limited promotions">
                <Btn>+ Schedule Event</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Active Sales" value={String(active)} iconChar="⚡" color={T.orange} sub="Running now" />
                <StatCard label="Total Events" value={String(sales.length)} iconChar="◎" color={T.blue} sub="All time" />
                <StatCard label="Avg Duration" value="24h" iconChar="⊙" color={T.cyan} sub="Per event" />
            </div>

            {sales.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>No flash sales scheduled yet.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {sales.map((s) => (
                        <Card key={s.id} style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.name || s.title}</span>
                                        <Chip s={s.status || "draft"} />
                                    </div>
                                    <div style={{ fontSize: 11, color: T.textMuted }}>
                                        {s.starts_at && new Date(s.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        {s.ends_at && ` → ${new Date(s.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                                    </div>
                                </div>
                                {s.discount_percentage && (
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Discount</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: T.orange, fontFamily: "var(--font-jetbrains), monospace" }}>{s.discount_percentage}%</div>
                                    </div>
                                )}
                                <Btn small variant="ghost">Edit</Btn>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
