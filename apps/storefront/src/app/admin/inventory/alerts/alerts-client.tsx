"use client";

import React, { useState } from "react";
import { Package, AlertTriangle, XCircle, CheckCircle2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PageHeader, Card, StatCard, Btn, T } from "@/components/admin/ui-pro";

interface LowStockItem {
    id: string;
    name: string;
    sku: string | null;
    stock_quantity: number;
    low_stock_threshold: number | null;
    nav_category: string | null;
}

interface Props {
    initialLowStock: LowStockItem[];
}

export default function AlertsClient({ initialLowStock }: Props) {
    const [items] = useState(initialLowStock);
    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "low">("all");

    const enhanced = items.map(item => {
        const threshold = item.low_stock_threshold ?? 5;
        const isCritical = item.stock_quantity <= Math.max(2, Math.floor(threshold * 0.3));
        return { ...item, threshold, isCritical };
    });

    const critical = enhanced.filter(i => i.isCritical).length;
    const low = enhanced.filter(i => !i.isCritical).length;

    const filtered = enhanced.filter(item => {
        const matchSearch = !search ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.sku || "").toLowerCase().includes(search.toLowerCase()) ||
            (item.nav_category || "").toLowerCase().includes(search.toLowerCase());
        const matchSeverity =
            severityFilter === "all" ||
            (severityFilter === "critical" && item.isCritical) ||
            (severityFilter === "low" && !item.isCritical);
        return matchSearch && matchSeverity;
    });

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
            <PageHeader title="Low Stock Alerts" sub="Published products below reorder threshold">
                <Btn small variant="ghost" className="gap-2">
                    <Package size={13} /> Create Purchase Order
                </Btn>
            </PageHeader>

            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    label="Critical"
                    value={String(critical)}
                    color={T.red}
                    icon={XCircle}
                    sub="≤30% of threshold"
                />
                <StatCard
                    label="Low Stock"
                    value={String(low)}
                    color={T.orange}
                    icon={AlertTriangle}
                    sub="Below threshold"
                />
                <StatCard
                    label="All Clear"
                    value={items.length === 0 ? "✓" : "—"}
                    color={T.green}
                    icon={CheckCircle2}
                    sub={items.length === 0 ? "All SKUs healthy" : `${items.length} need attention`}
                />
            </div>

            <Card className="overflow-hidden">
                <div className="p-5 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/10">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search product, SKU, category..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={13} className="text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {(["all", "critical", "low"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setSeverityFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    severityFilter === f
                                        ? "bg-primary text-white"
                                        : "border border-border/50 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {f} ({f === "all" ? items.length : f === "critical" ? critical : low})
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <CheckCircle2 size={32} className="text-green-400/40" />
                        <p className="text-sm text-muted-foreground">
                            {search ? "No products match your search." : "All published products are within safe stock levels."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/20">
                        <AnimatePresence mode="popLayout">
                            {filtered.map(item => {
                                const pct = Math.min(100, (item.stock_quantity / item.threshold) * 100);
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-5 px-6 py-4 hover:bg-muted/10 transition-colors"
                                    >
                                        {/* Severity dot */}
                                        <div className={cn(
                                            "w-2 h-2 rounded-full flex-shrink-0",
                                            item.isCritical ? "bg-red-500 animate-pulse" : "bg-orange-400"
                                        )} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-bold truncate">{item.name}</span>
                                                {item.nav_category && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground uppercase tracking-wider flex-shrink-0">
                                                        {item.nav_category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] font-mono text-muted-foreground">{item.sku || "NO-SKU"}</div>
                                        </div>

                                        <div className="w-56 flex-shrink-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {item.stock_quantity} / {item.threshold} units
                                                </span>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-wider",
                                                    item.isCritical ? "text-red-400" : "text-orange-400"
                                                )}>
                                                    {item.isCritical ? "CRITICAL" : "LOW STOCK"}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        item.isCritical ? "bg-red-500" : "bg-orange-400"
                                                    )}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Btn small variant="ghost" className="flex-shrink-0">
                                            Restock
                                        </Btn>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </Card>
        </div>
    );
}
