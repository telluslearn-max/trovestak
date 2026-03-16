"use client";

import React, { useState } from "react";
import { MapPin, Package, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card, StatCard, PageHeader, T } from "@/components/admin/ui-pro";
import type { CountyData } from "./page";

interface Props {
    countyData: CountyData[];
    totalOrders: number;
    totalRevenue: number;
}

// Kenya counties grouped by region for the grid layout
const KENYA_REGIONS: Record<string, string[]> = {
    "Nairobi": ["Nairobi"],
    "Central": ["Kiambu", "Murang'a", "Kirinyaga", "Nyeri", "Nyandarua"],
    "Coast": ["Mombasa", "Kilifi", "Kwale", "Taita Taveta", "Tana River", "Lamu"],
    "Rift Valley": ["Nakuru", "Uasin Gishu", "Trans Nzoia", "Nandi", "Kericho", "Bomet", "Baringo", "Elgeyo Marakwet", "Kajiado", "Laikipia", "Narok", "Samburu", "Turkana", "West Pokot"],
    "Western": ["Kakamega", "Bungoma", "Busia", "Vihiga"],
    "Nyanza": ["Kisumu", "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira"],
    "Eastern": ["Machakos", "Makueni", "Kitui", "Embu", "Meru", "Tharaka Nithi", "Marsabit", "Isiolo"],
    "North Eastern": ["Garissa", "Wajir", "Mandera"],
};

const fmtKES = (n: number) =>
    n >= 1_000_000 ? `KES ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `KES ${(n / 1_000).toFixed(0)}k`
    : `KES ${n.toLocaleString()}`;

function CountyCell({ county, orders, maxOrders, revenue }: {
    county: string;
    orders: number;
    maxOrders: number;
    revenue: number;
}) {
    const intensity = maxOrders > 0 ? orders / maxOrders : 0;
    const alpha = 0.1 + intensity * 0.85;
    const textColor = intensity > 0.6 ? "#fff" : "var(--admin-text)";

    return (
        <motion.div
            whileHover={{ scale: 1.04 }}
            title={`${county}\n${orders} orders • ${fmtKES(revenue)}`}
            className="relative rounded-xl p-2.5 cursor-default transition-all"
            style={{
                background: `rgba(0, 113, 227, ${alpha})`,
                border: `1px solid rgba(0, 113, 227, ${alpha + 0.1})`,
                minHeight: 52,
            }}
        >
            <div className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: textColor, opacity: 0.8 }}>
                {county}
            </div>
            {orders > 0 && (
                <div className="text-base font-black font-mono leading-tight" style={{ color: textColor }}>
                    {orders}
                </div>
            )}
        </motion.div>
    );
}

export default function TrafficClient({ countyData, totalOrders, totalRevenue }: Props) {
    const [view, setView] = useState<"heatmap" | "table">("heatmap");

    const countyLookup: Record<string, CountyData> = {};
    for (const c of countyData) {
        countyLookup[c.county] = c;
        // Also match case-insensitively
        countyLookup[c.county.toLowerCase()] = c;
    }

    const maxOrders = countyData.length > 0 ? countyData[0].orders : 1;
    const top5 = countyData.slice(0, 5);

    const getCounty = (name: string) =>
        countyLookup[name] || countyLookup[name.toLowerCase()] || { county: name, orders: 0, revenue: 0 };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <PageHeader title="Kenya Delivery Heatmap" sub="Order distribution by county — paid orders only">
                <div className="flex gap-2">
                    {(["heatmap", "table"] as const).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                view === v ? "bg-primary text-white" : "border border-border/50 text-muted-foreground"
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </PageHeader>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Counties Reached"
                    value={String(countyData.filter(c => c.county !== "Unknown").length)}
                    color={T.blue}
                    icon={MapPin}
                    sub="of 47 Kenya counties"
                />
                <StatCard
                    label="Top County"
                    value={top5[0]?.county || "—"}
                    color={T.green}
                    icon={TrendingUp}
                    sub={top5[0] ? `${top5[0].orders} orders` : "No data"}
                />
                <StatCard
                    label="Total Orders"
                    value={String(totalOrders)}
                    color={T.cyan}
                    icon={Package}
                    sub="Paid deliveries"
                />
                <StatCard
                    label="Total Revenue"
                    value={fmtKES(totalRevenue)}
                    color={T.purple}
                    iconChar="◆"
                    sub="All counties"
                />
            </div>

            {view === "heatmap" ? (
                <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold">County Distribution</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Color intensity = order volume</div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded" style={{ background: "rgba(0, 113, 227, 0.1)" }} />
                                <span>0</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded" style={{ background: "rgba(0, 113, 227, 0.6)" }} />
                                <span>Med</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded" style={{ background: "rgba(0, 113, 227, 0.95)" }} />
                                <span>High</span>
                            </div>
                        </div>
                    </div>

                    {totalOrders === 0 ? (
                        <div className="py-16 text-center flex flex-col items-center gap-3">
                            <MapPin size={28} className="text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground">No paid orders yet. Data will appear here once orders are placed.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(KENYA_REGIONS).map(([region, counties]) => (
                                <div key={region}>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{region}</div>
                                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(counties.length, 6)}, 1fr)` }}>
                                        {counties.map(county => {
                                            const data = getCounty(county);
                                            return (
                                                <CountyCell
                                                    key={county}
                                                    county={county}
                                                    orders={data.orders}
                                                    revenue={data.revenue}
                                                    maxOrders={maxOrders}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr] px-6 py-3 border-b border-border/30 bg-muted/20">
                        {["County", "Orders", "Revenue", "Share"].map(h => (
                            <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                        ))}
                    </div>
                    {countyData.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">No data yet.</div>
                    ) : countyData.map((c, i) => (
                        <div key={c.county} className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr] px-6 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/10 items-center">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span className="text-[10px] font-mono font-bold text-muted-foreground/50 w-4">{i + 1}</span>
                                <MapPin size={12} className="text-muted-foreground/50" />
                                {c.county}
                            </div>
                            <div className="font-mono font-bold text-sm">{c.orders}</div>
                            <div className="font-mono text-sm">{fmtKES(c.revenue)}</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${totalOrders > 0 ? (c.orders / totalOrders) * 100 : 0}%`,
                                            background: `rgba(0, 113, 227, ${0.4 + (c.orders / maxOrders) * 0.6})`,
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] text-muted-foreground w-8 text-right font-mono">
                                    {totalOrders > 0 ? `${((c.orders / totalOrders) * 100).toFixed(0)}%` : "0%"}
                                </span>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
}
