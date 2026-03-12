"use client";

import { LucideIcon, Activity } from "lucide-react";
import { T, StatCard, Card, Btn } from "./ui-pro";

interface AdminPagePlaceholderProps {
    title: string;
    description: string;
    icon: LucideIcon;
    accentColor?: string;
    sectionName?: string;
    stats?: { label: string; value: string; icon: LucideIcon; color: string; sub?: string }[];
}

export const PageHeader = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-.02em" }}>{title}</h1>
            {sub && <p style={{ fontSize: 12, color: T.textMuted, margin: "4px 0 0" }}>{sub}</p>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>{children}</div>
    </div>
);

export function AdminPagePlaceholder({
    title,
    description,
    icon: Icon,
    sectionName = "Module",
    stats = []
}: AdminPagePlaceholderProps) {
    return (
        <div className="page-enter">
            <PageHeader title={title} sub={description}>
                <Btn>+ Add {sectionName}</Btn>
            </PageHeader>

            {/* Stats Grid */}
            {stats.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
                    {stats.map((stat, i) => (
                        <StatCard
                            key={i}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            sub={stat.sub}
                        />
                    ))}
                </div>
            )}

            {/* Main Content Placeholder */}
            <Card style={{ padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", borderStyle: "dashed", background: "transparent" }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, color: T.textMuted }}>
                    <Activity size={32} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Node Integration Pending</h3>
                <p style={{ fontSize: 13, color: T.textMuted, maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>
                    The {sectionName} protocol is currently being established. Real-time data streams will appear here once the handshake is complete.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                    <Btn>Connect Node</Btn>
                    <Btn variant="ghost">View Documentation</Btn>
                </div>
            </Card>
        </div>
    );
}
