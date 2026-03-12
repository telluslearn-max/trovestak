"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/admin/theme-wrapper";
import {
    Package,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Search,
    ArrowUpRight,
    RefreshCw,
    Factory,
    RotateCcw,
    Dna,
    Truck,
    Layers,
    Activity,
    ChevronRight,
    DollarSign
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface InventoryStats {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    activePOs: number;
    pendingTradeIns: number;
    unassignedUnits: number;
    inventoryValue: number;
}

interface InventoryClientProps {
    initialStats: InventoryStats;
}

export default function InventoryClient({ initialStats }: InventoryClientProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [stats] = useState(initialStats);
    const [animIn, setAnimIn] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimIn(true), 50);
    }, []);

    const flows = [
        {
            title: "Procurement Flow",
            subtitle: "Supplier Sourcing",
            icon: Factory,
            color: "#3b82f6",
            href: "/admin/inventory/suppliers",
            description: "Manage supplier relationships and official purchase orders.",
            stat: `${stats.activePOs} Active POs`,
            subItems: [
                { label: "Purchase Orders", href: "/admin/inventory/purchase-orders" },
                { label: "Suppliers", href: "/admin/inventory/suppliers" }
            ]
        },
        {
            title: "Inventory Ledger",
            subtitle: "Stock Provenance",
            icon: Dna,
            color: "#a855f7",
            href: "/admin/inventory/provenance",
            description: "Trace individual units back to their origin and cost basis.",
            stat: `${stats.unassignedUnits} Available Units`,
            subItems: [
                { label: "Detailed Ledger", href: "/admin/inventory/provenance" },
                { label: "Stock Levels", href: "/admin/inventory/stock" }
            ]
        },
        {
            title: "Trade-in Flow",
            subtitle: "Reverse Logistics",
            icon: RotateCcw,
            color: "#22c55e",
            href: "/admin/inventory/trade-ins",
            description: "Intake and valuation for customer-sourced inventory.",
            stat: `${stats.pendingTradeIns} Pending Intake`,
            subItems: [
                { label: "Trade-in Intake", href: "/admin/inventory/trade-ins" },
                { label: "Condition Grading", href: "/admin/inventory/trade-ins?tab=grading" }
            ]
        }
    ];

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-700 ease-out"
            style={{ background: isDark ? "#020617" : "#f8fafc", opacity: animIn ? 1 : 0, transform: animIn ? "none" : "translateY(10px)" }}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div>
                    <div className="flex items-center gap-2 mb-3 text-blue-500 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                        <Activity size={14} />
                        <span>Logistics Hub</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-foreground mb-2">
                        Three-Flow <span className="text-slate-500 italic font-medium">Operations</span>
                    </h1>
                    <p className="text-slate-500 text-sm max-w-lg font-medium">
                        Unified control center for Procurement, Inventory Provenance, and Reverse Logistics.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Asset Value</div>
                            <div className="text-lg font-black text-foreground font-mono leading-none">KES {new Intl.NumberFormat().format(stats.inventoryValue)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                {flows.map((flow, i) => (
                    <div key={i} className="group relative bg-slate-900/40 border border-slate-800 rounded-[40px] p-8 hover:bg-slate-900/60 transition-all duration-500 hover:border-slate-700/50">
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-20 h-20 rounded-3xl bg-slate-800/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-500" style={{ color: flow.color }}>
                                <flow.icon size={36} />
                            </div>
                            <Link href={flow.href}>
                                <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-colors">
                                    <ArrowUpRight size={20} />
                                </button>
                            </Link>
                        </div>

                        <div className="mb-10">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: flow.color }}>{flow.subtitle}</div>
                            <h3 className="text-3xl font-black text-foreground mb-4 group-hover:translate-x-1 transition-transform">{flow.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{flow.description}</p>
                            <div className="px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50 w-fit text-xs font-bold text-foreground font-mono">
                                {flow.stat}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {flow.subItems.map((item, j) => (
                                <Link key={j} href={item.href}>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-white/[0.03] hover:border-white/10 hover:bg-slate-950/80 transition-all group/item cursor-pointer">
                                        <span className="text-xs font-bold text-slate-400 group-hover/item:text-foreground transition-colors">{item.label}</span>
                                        <ChevronRight size={14} className="text-slate-600 group-hover/item:text-foreground group-hover/item:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stock Alerts Grid */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                        <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Critical Supply Alerts</h4>
                    </div>
                    <Link href="/admin/inventory/alerts">
                        <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-foreground transition-colors">View All Health Reports</button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 rounded-3xl bg-slate-950/50 border border-red-500/10 flex flex-col justify-between h-32">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Out of Stock</div>
                        <div className="text-3xl font-black text-red-500 font-mono">{stats.outOfStock}</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-950/50 border border-orange-500/10 flex flex-col justify-between h-32">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Low Stock SKU</div>
                        <div className="text-3xl font-black text-orange-500 font-mono">{stats.lowStock}</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-950/50 border border-blue-500/10 flex flex-col justify-between h-32">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Procurement</div>
                        <div className="text-3xl font-black text-blue-500 font-mono">{stats.activePOs}</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-950/50 border border-emerald-500/10 flex flex-col justify-between h-32">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receiving Target</div>
                        <div className="text-3xl font-black text-emerald-500 font-mono">1,4k Units</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
