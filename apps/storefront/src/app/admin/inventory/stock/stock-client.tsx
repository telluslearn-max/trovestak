"use client";

import React, { useState } from "react";
import { Boxes, Package, AlertTriangle, CheckCircle2, Search, Filter, RefreshCw, MoreVertical, Archive, ArrowDownToLine } from "lucide-react";
import {
    PageHeader, Card, StatCard, Btn, Chip, T, SInput, TH, TD
} from "@/components/admin/ui-pro";

interface Product {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    cost_price: number;
    nav_category: string | null;
}

interface StockClientProps {
    initialProducts: Product[];
}

export default function StockClient({ initialProducts }: StockClientProps) {
    const [products] = useState(initialProducts);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const filtered = products.filter(p =>
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: "Total SKUs", value: products.length.toLocaleString(), icon: Boxes, color: T.blue },
        { label: "In Stock", value: products.filter(p => p.stock_quantity > 0).length.toLocaleString(), icon: CheckCircle2, color: T.green },
        { label: "Out of Stock", value: products.filter(p => p.stock_quantity === 0).length.toLocaleString(), icon: AlertTriangle, color: T.red },
    ];

    const handleRefresh = () => {
        setLoading(true);
        window.location.reload();
    };

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1600, margin: "0 auto" }}>
            <PageHeader title="Stock Levels" sub="Live inventory across all points of presence">
                <Btn variant="ghost"><Archive size={16} style={{ marginRight: 8 }} /> Archive</Btn>
                <Btn><ArrowDownToLine size={16} style={{ marginRight: 8 }} /> Export CSV</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {stats.map(s => (
                    <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
                ))}
            </div>

            <div style={{ marginBottom: 20, display: "flex", gap: 12 }}>
                <div style={{ width: 320 }}>
                    <SInput value={search} onChange={setSearch} placeholder="Search by SKU or Name..." icon={<Search size={14} />} />
                </div>
                <Btn variant="ghost"><Filter size={14} style={{ marginRight: 8 }} /> Filter Categories</Btn>
                <Btn variant="ghost" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </Btn>
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2.5fr 1fr 1fr 1fr 1.5fr" }}>
                    {["SKU", "Product", "Stock", "Category", "Avg. Cost", "Action"].map(h => <TH key={h}>{h}</TH>)}
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: "span 6", padding: 80, textAlign: "center", color: T.textMuted }}>
                            No stock records found matching criteria.
                        </div>
                    ) : (
                        filtered.map((p, i) => [
                            <TD key={`sk${i}`} mono muted>{p.sku || "NO-SKU"}</TD>,
                            <TD key={`nm${i}`}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.name}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>ID: {p.id.substring(0, 8)}</div>
                                </div>
                            </TD>,
                            <TD key={`st${i}`} mono>
                                <span style={{
                                    fontWeight: 800,
                                    color: p.stock_quantity === 0 ? T.red : p.stock_quantity <= 10 ? T.orange : T.green
                                }}>
                                    {p.stock_quantity}
                                </span>
                            </TD>,
                            <TD key={`ca${i}`} muted>{p.nav_category || "Uncategorized"}</TD>,
                            <TD key={`co${i}`} mono muted>KES {Number(p.cost_price || 0).toLocaleString()}</TD>,
                            <TD key={`ac${i}`}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn small variant="ghost">Adjust</Btn>
                                    <Btn small variant="ghost"><MoreVertical size={14} /></Btn>
                                </div>
                            </TD>,
                        ])
                    )}
                </div>
            </Card>
        </div>
    );
}
