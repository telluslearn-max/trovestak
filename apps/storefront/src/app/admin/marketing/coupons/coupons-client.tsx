"use client";

import React, { useState } from "react";
import { Card, Btn, T, PageHeader, Chip } from "@/components/admin/ui-pro";

interface Discount {
    id: string;
    name: string | null;
    code: string;
    is_active: boolean;
    discount_type: string | null;
    value: number | null;
    discount_value: number | null;
    expires_at: string | null;
    usage_count: number | null;
    maximum_uses: number | null;
}

interface CouponsClientProps {
    initialCoupons: Discount[];
}

export default function CouponsClient({ initialCoupons }: CouponsClientProps) {
    const [coupons] = useState(initialCoupons);
    const active = coupons.filter(c => c.is_active).length;

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Promotions & Coupons" sub={`${active} active · ${coupons.length - active} expired`}>
                <Btn>+ Create Promotion</Btn>
            </PageHeader>

            {coupons.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>No coupons created yet.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {coupons.map((p) => {
                        const status = p.is_active ? "active" : "expired";
                        const discountDisplay = p.discount_type === "percentage"
                            ? `${p.discount_value || p.value}%`
                            : `$${p.discount_value || p.value || 0}`;
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
                                            {p.usage_count || 0}{p.maximum_uses ? ` / ${p.maximum_uses}` : ""}
                                        </div>
                                        {p.maximum_uses && (
                                            <div style={{ height: 4, background: T.border, borderRadius: 4 }}>
                                                <div style={{ height: "100%", width: `${Math.min(100, ((p.usage_count || 0) / p.maximum_uses) * 100)}%`, background: status === "expired" ? T.textMuted : T.blue, borderRadius: 4 }} />
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
