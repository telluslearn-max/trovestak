"use client";

import React from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

const GATEWAYS = [
    { name: "M-Pesa STK Push", provider: "Safaricom Daraja API", successRate: 99.2, volume: "KES 1.2M/mo", status: "connected" },
    { name: "Stripe Card Processing", provider: "Stripe Inc.", successRate: 99.8, volume: "$42K/mo", status: "connected" },
    { name: "PayPal", provider: "PayPal Holdings", successRate: 98.1, volume: "$12K/mo", status: "connected" },
    { name: "Cash on Delivery", provider: "Internal", successRate: 100, volume: "KES 84K/mo", status: "connected" },
];

export default function PaymentGatewaysSettingsPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Payment Gateways" sub="Manage financial entry points and API keys">
                <Btn>+ Add Gateway</Btn>
            </PageHeader>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {GATEWAYS.map((g) => (
                    <Card key={g.name} style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{g.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{g.provider}</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Success Rate</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.green, fontFamily: "var(--font-jetbrains), monospace" }}>{g.successRate}%</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Volume</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>{g.volume}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block" }} />
                                <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Connected</span>
                            </div>
                            <Btn small variant="ghost">Configure</Btn>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
