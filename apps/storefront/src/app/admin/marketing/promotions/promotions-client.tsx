"use client";

import React, { useState } from "react";
import { Card, Btn, T, PageHeader, Chip } from "@/components/admin/ui-pro";

interface Promotion {
    id: string;
    name: string | null;
    code: string;
    type: string;
    value: number;
    is_active: boolean;
    expires_at: string | null;
    usage_count: number | null;
    usage_limit: number | null;
}

interface PromotionsClientProps {
    initialPromotions: Promotion[];
}

export default function PromotionsClient({ initialPromotions }: PromotionsClientProps) {
    const [promotions] = useState(initialPromotions);

    const active = promotions.filter(p => p.is_active).length;
    const expired = promotions.filter(p => !p.is_active).length;

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Promotions & Coupons" sub={`${active} active · ${expired} expired`}>
                <Btn>+ Create Promotion</Btn>
            </PageHeader>

            {promotions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>No promotions created yet.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {promotions.map((p, i) => {
                        const status = p.is_active ? "active" : "expired";
                        const discountDisplay = p.type === "percentage"
                            ? `${p.value}%`
                            : p.type === "fixed"
                                ? `$${p.value}`
                                : `${p.value}`;
                        return (
                            <Card key={p.id} style={{ padding: "20px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.name || p.code}</span>
                                            <Chip s={status} />
                                        </div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>
                                            Code: <span style={{ fontFamily: "var(--font-jetbrains), monospace", color: T.cyan, fontWeight: 700 }}>{p.code}</span>
                                            {p.expires_at && ` · Expires ${new Date(p.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Discount</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: T.green, fontFamily: "var(--font-jetbrains), monospace" }}>{discountDisplay}</div>
                                    </div>
                                    <div style={{ textAlign: "center", width: 120 }}>
                                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 6 }}>Usage</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4, fontFamily: "var(--font-jetbrains), monospace" }}>
                                            {p.usage_count || 0}{p.usage_limit ? ` / ${p.usage_limit}` : ""}
                                        </div>
                                        {p.usage_limit && (
                                            <div style={{ height: 4, background: T.border, borderRadius: 4 }}>
                                                <div style={{ height: "100%", width: `${Math.min(100, ((p.usage_count || 0) / p.usage_limit) * 100)}%`, background: status === "expired" ? T.textMuted : T.blue, borderRadius: 4 }} />
                                            </div>
                                        )}
                                    </div>
                                    <Btn small variant="ghost">Edit</Btn>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
