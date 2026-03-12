"use client";

import React, { useState } from "react";
import {
    Home,
    Plus,
    Search,
    MapPin,
    Database,
    MoreVertical,
    ArrowUpRight,
    Navigation,
    Activity,
    Building2,
    Tag
} from "lucide-react";
import { useTheme } from "@/components/admin/theme-wrapper";

interface Warehouse {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
}

interface WarehousesClientProps {
    initialWarehouses: Warehouse[];
}

export default function WarehousesClient({ initialWarehouses }: WarehousesClientProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [warehouses] = useState(initialWarehouses);
    const [search, setSearch] = useState("");

    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.code || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-3 text-violet-500 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                        <Home size={14} />
                        <span>Logistics Node</span>
                    </div>
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground mb-2">
                        Storage <span className="text-slate-500 italic font-medium">Nodes</span>
                    </h1>
                    <p className="text-slate-500 text-[13px] max-w-lg font-medium opacity-80">
                        Manage physical warehouses, distribution hubs, and retail outlets. Control stock partitioning and routing efficiency.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl">
                        <Plus size={16} strokeWidth={3} />
                        Register New Node
                    </button>
                </div>
            </div>

            {/* Capacity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Active Nodes", value: warehouses.length, icon: Building2, color: "#a855f7" },
                    { label: "Storage Efficiency", value: "82%", icon: Activity, color: "#22c55e" },
                    { label: "Transit Points", value: "3 Hubs", icon: Navigation, color: "#3b82f6" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/80 rounded-[14px] p-[20px] px-[22px] flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</div>
                            <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center" style={{ color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Warehouse Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.length === 0 ? (
                    <div className="col-span-full py-32 text-center text-slate-600 font-medium">No storage nodes registered in the system.</div>
                ) : filteredWarehouses.map((node) => (
                    <div key={node.id} className="group bg-slate-900 border border-slate-800 rounded-[14px] p-[24px] hover:bg-slate-900/60 transition-all duration-500 hover:border-violet-500/50 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
                                <Building2 size={24} />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-all">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-wider">Online</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                                {node.name}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold font-mono tracking-widest uppercase">
                                <Tag size={12} className="text-violet-500" /> {node.code || "NO-CODE"}
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <MapPin size={16} className="text-slate-600" />
                                <span className="line-clamp-1">{node.address || "No address assigned"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <Database size={16} className="text-slate-600" />
                                <span>8,432 Total SKUs</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                            <div className="flex items-center gap-1.5 text-violet-500 font-black text-[10px] uppercase tracking-widest cursor-pointer group-hover:gap-3 transition-all">
                                Node Configuration <ArrowUpRight size={14} />
                            </div>
                            <button className="p-2 rounded-xl bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700 transition-all">
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
