"use client";

import React, { useState } from "react";
import { Card, Btn, T, PageHeader, SInput } from "@/components/admin/ui-pro";

interface TaxZone {
    zone: string;
    rate: number;
    type: string;
    status: string;
    code: string;
}

interface TaxClientProps {
    initialZones: TaxZone[];
}

export default function TaxClient({ initialZones }: TaxClientProps) {
    const [taxIdKe, setTaxIdKe] = useState("P051234567T");

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Tax Configuration" sub="Regional tax compliance and rate management">
                <Btn>+ Add Jurisdiction</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, maxWidth: 800 }}>
                <Card style={{ padding: "24px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>Store Tax Identity</div>
                    <div style={{ marginBottom: 14 }}>
                        <div className={T.labelMuted}>Kenya Tax PIN (KRA)</div>
                        <SInput value={taxIdKe} onChange={setTaxIdKe} placeholder="PIN Number" />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <div className={T.labelMuted}>Tax Display</div>
                        <select style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "'Syne', sans-serif" }}>
                            <option>Inclusive (prices include tax)</option>
                            <option>Exclusive (tax added at checkout)</option>
                        </select>
                    </div>
                    <Btn>Save Tax Settings</Btn>
                </Card>

                <Card style={{ padding: "24px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>Compliance Status</div>
                    {[
                        { label: "KRA iTax Sync", v: "Active", c: T.green },
                        { label: "VAT Filing", v: "Monthly", c: T.blue },
                        { label: "Compliance Score", v: "100%", c: T.green },
                    ].map(s => (
                        <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ fontSize: 12, color: T.textSub }}>{s.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: s.c, fontFamily: "var(--font-jetbrains), monospace" }}>{s.v}</span>
                        </div>
                    ))}
                </Card>
            </div>

            <Card>
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Tax Jurisdictions</div>
                </div>
                {initialZones.map((z, i) => (
                    <div key={z.code} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderBottom: i < initialZones.length - 1 ? `1px solid ${T.border}` : "" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 2 }}>{z.zone}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{z.code} · {z.type}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>
                                {z.rate === 0 ? "—" : `${z.rate}%`}
                            </div>
                        </div>
                        <span style={{ fontSize: 10, background: T.green + "20", color: T.green, borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>{z.status}</span>
                        <Btn small variant="ghost">Edit</Btn>
                    </div>
                ))}
            </Card>
        </div>
    );
}
