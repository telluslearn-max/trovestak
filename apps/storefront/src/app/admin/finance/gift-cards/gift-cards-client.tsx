"use client";

import React, { useState } from "react";
import { Card, Btn, TH, TD, T, PageHeader, Chip } from "@/components/admin/ui-pro";

interface GiftCard {
    id: string;
    code: string;
    issued_to: string | null;
    customer_email: string | null;
    initial_balance: number;
    value: number;
    current_balance: number;
    balance: number;
    status: string;
    created_at: string;
}

interface GiftCardsClientProps {
    initialCards: GiftCard[];
}

const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GiftCardsClient({ initialCards }: GiftCardsClientProps) {
    const [cards] = useState(initialCards);
    const active = cards.filter(c => c.status === "active").length;

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Gift Cards" sub={`${active} active cards`}>
                <Btn>+ Issue Gift Card</Btn>
            </PageHeader>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 0.8fr" }}>
                    {["Code", "Issued To", "Value", "Balance", "Issued", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {cards.length === 0 ? (
                        <div style={{ gridColumn: "span 6", padding: "40px", textAlign: "center", color: T.textMuted }}>No gift cards issued yet.</div>
                    ) : cards.map((c, i) => [
                        <TD key={`co${i}`}><span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: T.cyan, fontWeight: 700 }}>{c.code}</span></TD>,
                        <TD key={`bu${i}`} muted>{c.issued_to || c.customer_email || "—"}</TD>,
                        <TD key={`va${i}`} mono>{fmt(c.initial_balance || c.value || 0)}</TD>,
                        <TD key={`ba${i}`} mono color={(c.current_balance || c.balance || 0) > 0 ? T.green : T.textMuted}>{fmt(c.current_balance || c.balance || 0)}</TD>,
                        <TD key={`is${i}`} muted>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TD>,
                        <TD key={`st${i}`}><Chip s={c.status || "active"} /></TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
