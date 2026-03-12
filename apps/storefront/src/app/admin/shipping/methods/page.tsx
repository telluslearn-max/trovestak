"use client";

import React from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

const CARRIERS = [
    { name: "Sendy Express", type: "Last Mile", zones: ["Nairobi CBD", "Nairobi Suburbs"], avgDays: 0.5, rate: 200, status: "active" },
    { name: "G4S Courier", type: "Regional", zones: ["Greater Nairobi", "Kenya Mainland"], avgDays: 2, rate: 500, status: "active" },
    { name: "Wells Fargo Couriers", type: "Nationwide", zones: ["Kenya Mainland"], avgDays: 3, rate: 800, status: "active" },
    { name: "DHL Express", type: "International", zones: ["East Africa", "Global"], avgDays: 5, rate: 2500, status: "active" },
    { name: "FedEx International", type: "International", zones: ["Global"], avgDays: 10, rate: 8000, status: "active" },
    { name: "Pickup (Self-collection)", type: "In-store", zones: ["Nairobi"], avgDays: 0, rate: 0, status: "active" },
];

export default function ShippingMethodsPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Methods & Carriers" sub="Logistics partners and delivery protocols">
                <Btn>+ Add Carrier</Btn>
            </PageHeader>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CARRIERS.map((c) => (
                    <Card key={c.name} style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>
                                    {c.type} · {c.zones.join(", ")}
                                </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Rate</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>
                                    {c.rate === 0 ? "Free" : `KES ${c.rate}`}
                                </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>ETA</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.cyan }}>
                                    {c.avgDays === 0 ? "Instant" : `${c.avgDays}d`}
                                </div>
                            </div>
                            <span style={{
                                fontSize: 10, padding: "3px 9px", borderRadius: 5,
                                background: T.green + "20", color: T.green, fontWeight: 700
                            }}>Active</span>
                            <Btn small variant="ghost">Edit</Btn>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
