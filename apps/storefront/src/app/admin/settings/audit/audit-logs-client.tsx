"use client";

import React, { useState } from "react";
import { Card, Btn, T, PageHeader, TH, TD } from "@/components/admin/ui-pro";

interface AuditLog {
    id: string;
    created_at: string;
    admin_email: string | null;
    user_id: string | null;
    action: string | null;
    event: string | null;
    entity_type: string | null;
    resource: string | null;
    ip_address: string | null;
}

interface AuditLogsClientProps {
    initialLogs: AuditLog[];
}

export default function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
    const [logs] = useState(initialLogs);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Audit Logs" sub="Immutable record of administrative activity">
                <Btn variant="ghost">Export</Btn>
            </PageHeader>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1.5fr 1fr 0.8fr" }}>
                    {["Time", "Admin", "Action", "Entity", "IP"].map(h => <TH key={h}>{h}</TH>)}
                    {logs.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>No audit events found.</div>
                    ) : logs.map((l, i) => [
                        <TD key={`t${i}`} muted>
                            {new Date(l.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </TD>,
                        <TD key={`a${i}`}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.admin_email || l.user_id || "Admin"}</span>
                        </TD>,
                        <TD key={`ac${i}`}>
                            <span style={{ fontSize: 11, background: T.blue + "20", color: T.blue, borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>
                                {l.action || l.event || "UPDATE"}
                            </span>
                        </TD>,
                        <TD key={`en${i}`} muted>{l.entity_type || l.resource || "—"}</TD>,
                        <TD key={`ip${i}`}>
                            <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{l.ip_address || "—"}</span>
                        </TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
