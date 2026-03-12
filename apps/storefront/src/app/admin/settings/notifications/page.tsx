"use client";

import React, { useState } from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

const NOTIFICATION_GROUPS = [
    {
        group: "Order Events",
        items: [
            { label: "New Order Placed", email: true, push: true, sms: false },
            { label: "Order Shipped", email: true, push: true, sms: true },
            { label: "Order Delivered", email: true, push: false, sms: false },
            { label: "Order Cancelled", email: true, push: true, sms: false },
        ]
    },
    {
        group: "Inventory",
        items: [
            { label: "Low Stock Alert", email: true, push: true, sms: false },
            { label: "Out of Stock", email: true, push: true, sms: true },
        ]
    },
    {
        group: "Finance",
        items: [
            { label: "Refund Initiated", email: true, push: false, sms: false },
            { label: "Payment Failed", email: true, push: true, sms: true },
        ]
    },
];

const Toggle = ({ on }: { on: boolean }) => (
    <div style={{
        width: 28, height: 16, borderRadius: 10,
        background: on ? T.green : T.border, position: "relative",
        transition: "background 0.2s", cursor: "default", flexShrink: 0
    }}>
        <div style={{
            position: "absolute", top: 2, left: on ? 14 : 2,
            width: 12, height: 12, borderRadius: "50%",
            background: "#fff", transition: "left 0.2s"
        }} />
    </div>
);

export default function NotificationsSettingsPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Notifications" sub="Alert channels and trigger configuration">
                <Btn>Save Preferences</Btn>
            </PageHeader>

            {/* Channel legend */}
            <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "12px 22px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textSub, fontWeight: 600 }}>
                    <span style={{ fontSize: 14 }}>📧</span> Email
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textSub, fontWeight: 600 }}>
                    <span style={{ fontSize: 14 }}>📲</span> Push
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textSub, fontWeight: 600 }}>
                    <span style={{ fontSize: 14 }}>💬</span> SMS
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {NOTIFICATION_GROUPS.map(group => (
                    <Card key={group.group} style={{ padding: "0" }}>
                        <div style={{ padding: "12px 22px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.text }}>
                            {group.group}
                        </div>
                        {group.items.map((item, i) => (
                            <div key={item.label} style={{
                                display: "flex", alignItems: "center", gap: 16, padding: "13px 22px",
                                borderBottom: i < group.items.length - 1 ? `1px solid ${T.border}` : ""
                            }}>
                                <div style={{ flex: 1, fontSize: 12, color: T.textSub }}>{item.label}</div>
                                <div style={{ display: "flex", gap: 20 }}>
                                    <Toggle on={item.email} />
                                    <Toggle on={item.push} />
                                    <Toggle on={item.sms} />
                                </div>
                            </div>
                        ))}
                    </Card>
                ))}
            </div>
        </div>
    );
}
