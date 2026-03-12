"use client";

import React from "react";
import { Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

const SHIPPING_ZONES = [
    { zone: "Nairobi CBD", carrier: "Sendy Express", price: 200, time: "<4h", orders: 284 },
    { zone: "Nairobi Suburbs", carrier: "Sendy Standard", price: 350, time: "Same Day", orders: 211 },
    { zone: "Greater Nairobi", carrier: "G4S Courier", price: 500, time: "1-2d", orders: 149 },
    { zone: "Kenya Mainland", carrier: "Wells Fargo Couriers", price: 800, time: "2-4d", orders: 98 },
    { zone: "East Africa", carrier: "DHL Express", price: 2500, time: "3-5d", orders: 42 },
    { zone: "International", carrier: "FedEx International", price: 8000, time: "7-14d", orders: 18 },
];

export default function ShippingZonesPage() {
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Shipping Methods & Zones" sub="Delivery coverage and carrier configuration">
                <Btn>+ Add Zone</Btn>
            </PageHeader>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {SHIPPING_ZONES.map((z) => (
                    <Card key={z.zone} style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{z.zone}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Carrier: {z.carrier}</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Rate</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>KES {z.price}</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>ETA</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.cyan }}>{z.time}</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 4 }}>Orders</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.purple, fontFamily: "var(--font-jetbrains), monospace" }}>{z.orders}</div>
                            </div>
                            <Btn small variant="ghost">Edit</Btn>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
