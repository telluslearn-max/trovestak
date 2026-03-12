"use client";

import React, { useState } from "react";
import { Card, Btn, SInput, T, PageHeader } from "@/components/admin/ui-pro";

const INTEGRATIONS = [
    { n: "M-Pesa Daraja API", s: "connected", c: "#22c55e" },
    { n: "WhatsApp Cloud API", s: "connected", c: "#22c55e" },
    { n: "Reloadly Gift Cards", s: "connected", c: "#22c55e" },
    { n: "Sendy Courier", s: "connected", c: "#22c55e" },
    { n: "Google Analytics", s: "disconnected", c: T.textMuted },
];

const SECTIONS = [
    { key: "store", label: "Store Identity" },
    { key: "payments", label: "Payment Methods" },
    { key: "integrations", label: "Integrations" },
];

export default function GeneralSettingsPage() {
    const [storeName, setStoreName] = useState("TroveStaK KE");
    const [currency, setCurrency] = useState("KES");
    const [email, setEmail] = useState("admin@trovestak.co.ke");
    const [section, setSection] = useState("store");

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Store Settings" sub="Core configuration for your store" />

            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, maxWidth: 900, alignItems: "start" }}>
                {/* Sidebar nav */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {SECTIONS.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSection(s.key)}
                            style={{
                                background: section === s.key ? T.surface : "transparent",
                                border: `1px solid ${section === s.key ? T.border : "transparent"}`,
                                borderRadius: 8, padding: "9px 14px", textAlign: "left", cursor: "pointer",
                                fontSize: 12, fontWeight: section === s.key ? 700 : 500, color: section === s.key ? T.text : T.textSub,
                                fontFamily: "'Syne', sans-serif"
                            }}
                        >{s.label}</button>
                    ))}
                </div>

                {/* Content */}
                {section === "store" && (
                    <Card style={{ padding: "28px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>Store Identity</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                                <div className={T.labelMuted}>Store Name</div>
                                <SInput value={storeName} onChange={setStoreName} placeholder="Store name" />
                            </div>
                            <div>
                                <div className={T.labelMuted}>Admin Email</div>
                                <SInput value={email} onChange={setEmail} placeholder="Email" />
                            </div>
                            <div>
                                <div className={T.labelMuted}>Currency</div>
                                <select
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "'Syne', sans-serif" }}
                                >
                                    <option>KES</option>
                                    <option>USD</option>
                                    <option>EUR</option>
                                </select>
                            </div>
                            <div><Btn>Save Settings</Btn></div>
                        </div>
                    </Card>
                )}

                {section === "payments" && (
                    <Card style={{ padding: "28px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>Payment Methods</div>
                        {[{ n: "M-Pesa STK Push", s: "Enabled", enabled: true }, { n: "Card (Stripe)", s: "Enabled", enabled: true }, { n: "Cash on Delivery", s: "Disabled", enabled: false }].map((p, i, arr) => (
                            <div key={p.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.n}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 11, color: p.enabled ? T.green : T.textMuted }}>{p.s}</span>
                                    <Btn small variant="ghost">Configure</Btn>
                                </div>
                            </div>
                        ))}
                    </Card>
                )}

                {section === "integrations" && (
                    <Card style={{ padding: "28px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>Integrations</div>
                        {INTEGRATIONS.map((itg, i, arr) => (
                            <div key={itg.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{itg.n}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: itg.c, display: "inline-block" }} />
                                    <span style={{ fontSize: 11, color: itg.c }}>{itg.s}</span>
                                </div>
                            </div>
                        ))}
                    </Card>
                )}
            </div>
        </div>
    );
}
