"use client";

import React, { useState } from "react";
import { Package, ShoppingCart, ArrowRight } from "lucide-react";
import {
    PageHeader, Card, Btn, T
} from "@/components/admin/ui-pro";

interface LowStockItem {
    id: string;
    name: string;
    sku: string | null;
    stock_quantity: number;
}

interface AlertsClientProps {
    initialLowStock: LowStockItem[];
}

export default function AlertsClient({ initialLowStock }: AlertsClientProps) {
    const [lowStock] = useState(initialLowStock);

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1000, margin: "0 auto" }}>
            <PageHeader title="Low Stock Alerts" sub={`${lowStock.length} SKUs below or near threshold`}>
                <Btn><ShoppingCart size={16} style={{ marginRight: 8 }} /> Create Purchase Order</Btn>
            </PageHeader>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {lowStock.length === 0 ? (
                    <Card style={{ padding: 80, textAlign: "center", color: T.textMuted }}>
                        <div style={{ marginBottom: 12 }}><Package size={32} style={{ opacity: 0.2, margin: "0 auto" }} /></div>
                        All SKUs are currently within safe operating thresholds.
                    </Card>
                ) : (
                    lowStock.map((item) => {
                        const threshold = 20; // Default threshold
                        const pct = Math.min(100, (item.stock_quantity / threshold) * 100);
                        const isCritical = item.stock_quantity <= 5;

                        return (
                            <Card key={item.id} style={{ padding: "20px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>{item.sku || "NO-SKU"}</div>
                                    </div>

                                    <div style={{ width: 240 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>
                                                {item.stock_quantity} / {threshold} units
                                            </span>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 800,
                                                color: isCritical ? T.red : T.orange,
                                                letterSpacing: ".05em"
                                            }}>
                                                {isCritical ? "CRITICAL" : "LOW STOCK"}
                                            </span>
                                        </div>
                                        <div style={{ height: 6, background: T.border, borderRadius: 10, overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${pct}%`,
                                                background: isCritical ? T.red : T.orange,
                                                borderRadius: 10,
                                                transition: "width 1s ease-out"
                                            }} />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Btn small variant="ghost">Reorder</Btn>
                                        <Btn small variant="ghost"><ArrowRight size={14} /></Btn>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
