"use client";

import React from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

interface Role {
    name: string;
    users: number;
    permissions: string;
    color: string;
}

interface RolesPermissionsClientProps {
    roles: Role[];
}

export default function RolesPermissionsClient({ roles }: RolesPermissionsClientProps) {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Roles & Permissions" sub="Admin team access control and security scopes">
                <Btn>+ Add User</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 24 }}>
                {roles.map(role => (
                    <Card key={role.name} style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{role.name}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: role.color, background: role.color + "20", borderRadius: 6, padding: "2px 8px" }}>
                                {role.users} {role.users === 1 ? "user" : "users"}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{role.permissions}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <Btn small variant="ghost">Manage</Btn>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
