"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD } from "@/components/admin/ui-pro";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
    stock_quantity: number | null;
    category: string | null;
}

interface ProductAnalyticsClientProps {
    initialProducts: Product[];
    stats: {
        total: number;
        avgPrice: number;
        topRevenue: number;
    };
}

const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

export default function ProductAnalyticsClient({ initialProducts, stats }: ProductAnalyticsClientProps) {
    const [products] = useState(initialProducts);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Product Analytics" sub="Performance metrics by product" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Products" value={String(stats.total)} iconChar="◈" color={T.blue} sub="In dataset" />
                <StatCard label="Avg. Price" value={`$${stats.avgPrice}`} iconChar="◆" color={T.green} sub="Across catalog" />
                <StatCard label="Top Rev. Potential" value={fmtK(stats.topRevenue)} iconChar="↗" color={T.purple} sub="Top SKU × stock" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr 0.8fr" }}>
                    {["Product", "SKU", "Price", "Stock", "Category"].map(h => <TH key={h}>{h}</TH>)}
                    {products.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: 40, textAlign: "center", color: T.textMuted }}>No products found.</div>
                    ) : products.map((p, i) => [
                        <TD key={`n${i}`}><span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{p.name}</span></TD>,
                        <TD key={`sk${i}`}><span style={{ fontSize: 10, fontFamily: "var(--font-jetbrains), monospace", color: T.textMuted }}>{p.sku || "—"}</span></TD>,
                        <TD key={`pr${i}`} mono color={T.green}>{`$${Number(p.price || 0).toLocaleString()}`}</TD>,
                        <TD key={`st${i}`} mono color={(p.stock_quantity || 0) > 10 ? T.text : T.orange}>{p.stock_quantity ?? "—"}</TD>,
                        <TD key={`ca${i}`} muted>{p.category || "—"}</TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
