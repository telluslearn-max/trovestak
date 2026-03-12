"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD, Av } from "@/components/admin/ui-pro";

interface Tier {
    name: string;
    min: number;
    max: number;
    color: string;
    count: number;
}

interface Customer {
    id: string;
    full_name: string | null;
    email: string;
    loyalty_points: number;
    created_at: string;
    tier: Tier;
}

interface LoyaltyProgramClientProps {
    initialCustomers: Customer[];
    tiers: Tier[];
    stats: {
        total: number;
        avgPoints: number;
        totalRedeemed: number;
    };
}

export default function LoyaltyProgramClient({ initialCustomers, tiers, stats }: LoyaltyProgramClientProps) {
    const [customers] = useState(initialCustomers);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Loyalty Program" sub="Customer rewards and tier management" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Active Members" value={String(stats.total)} iconChar="🏆" color={T.orange} sub="Enrolled" />
                <StatCard label="Avg. Points" value={`${stats.avgPoints.toLocaleString()} pts`} iconChar="⭐" color={T.blue} sub="Per member" />
                <StatCard label="Tier Breakdown" value={`${tiers.filter(t => t.count > 0).length} active`} iconChar="◉" color={T.purple} sub="Tiers populated" />
            </div>

            {/* Tier overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                {tiers.map(tier => (
                    <Card key={tier.name} style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{tier.name}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: tier.color, fontFamily: "var(--font-jetbrains), monospace" }}>{tier.count}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                            {tier.max === Infinity ? `${tier.min.toLocaleString()}+ pts` : `${tier.min.toLocaleString()} – ${tier.max.toLocaleString()} pts`}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Member table */}
            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr" }}>
                    {["Customer", "Points", "Tier", "Joined"].map(h => <TH key={h}>{h}</TH>)}
                    {customers.length === 0 ? (
                        <div style={{ gridColumn: "span 4", padding: "40px", textAlign: "center", color: T.textMuted }}>No loyalty members yet.</div>
                    ) : customers.map((c, i) => [
                        <TD key={`n${i}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Av l={(c.full_name || c.email || "U")[0]} size={28} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.full_name || "—"}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{c.email}</div>
                                </div>
                            </div>
                        </TD>,
                        <TD key={`pt${i}`} mono color={T.orange}>{(c.loyalty_points || 0).toLocaleString()}</TD>,
                        <TD key={`ti${i}`}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c.tier.color, background: c.tier.color + "20", borderRadius: 5, padding: "2px 8px" }}>
                                {c.tier.name}
                            </span>
                        </TD>,
                        <TD key={`jo${i}`} muted>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
