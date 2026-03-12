"use client";

import React from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

const INTEGRATIONS = [
    { name: "M-Pesa Daraja API", status: "connected", key: "sk_mpesa_***...***" },
    { name: "WhatsApp Cloud API", status: "connected", key: "sk_wa_***...***" },
    { name: "Reloadly Gift Cards", status: "connected", key: "sk_rl_***...***" },
    { name: "Sendy Courier", status: "connected", key: "sk_sd_***...***" },
    { name: "Google Analytics", status: "disconnected", key: "—" },
    { name: "SendGrid Email", status: "disconnected", key: "—" },
];

export default function APIIntegrationsSettingsPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="API & Integrations" sub="External system connectivity and API keys">
                <Btn>+ Add Integration</Btn>
            </PageHeader>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {INTEGRATIONS.map((itg) => (
                    <Card key={itg.name} style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{itg.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{itg.key}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: itg.status === "connected" ? T.green : T.textMuted, display: "inline-block" }} />
                                <span style={{ fontSize: 11, color: itg.status === "connected" ? T.green : T.textMuted, fontWeight: 600 }}>{itg.status}</span>
                            </div>
                            <Btn small variant="ghost">{itg.status === "connected" ? "Manage" : "Connect"}</Btn>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
