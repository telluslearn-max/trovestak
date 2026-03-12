"use client";

import React, { useState } from "react";
import { StatCard, Card, Btn, T, PageHeader } from "@/components/admin/ui-pro";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    meta_title: string | null;
    meta_description: string | null;
}

interface SEOToolsClientProps {
    products: Product[];
    totalIndexed: number;
    totalMissing: number;
}

export default function SEOToolsClient({ products, totalIndexed, totalMissing }: SEOToolsClientProps) {
    const [missingProducts] = useState(products);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="SEO Tools" sub="Search engine optimization across catalog" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Pages Indexed" value={String(totalIndexed)} iconChar="⊙" color={T.green} sub="Product catalog" />
                <StatCard label="Missing Meta" value={String(totalMissing)} iconChar="⚠" color={T.orange} sub="Products need SEO" />
                <StatCard label="Avg Title Length" value="54 chars" iconChar="◈" color={T.blue} sub="Optimal: 50-60" />
            </div>

            <Card>
                <div style={{ padding: "0 0 0 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Products Missing SEO</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{totalMissing} products need meta title and description</div>
                    </div>
                </div>
                {missingProducts.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: T.green, fontSize: 12 }}>
                        All products have SEO metadata ✓
                    </div>
                ) : missingProducts.map((p, i) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderBottom: i < missingProducts.length - 1 ? `1px solid ${T.bg}` : "" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.name}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{p.sku}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            {!p.meta_title && <span style={{ fontSize: 10, background: "#1c0505", color: "#fca5a5", borderRadius: 5, padding: "2px 8px" }}>No meta title</span>}
                            {!p.meta_description && <span style={{ fontSize: 10, background: "#1c0505", color: "#fca5a5", borderRadius: 5, padding: "2px 8px" }}>No meta desc</span>}
                        </div>
                        <Btn small variant="ghost">Fix SEO</Btn>
                    </div>
                ))}
            </Card>
        </div>
    );
}
