"use client";

import React, { useState } from "react";
import {
    Dna,
    Search,
    Filter,
    ArrowUpRight,
    History,
    Layers,
    Database,
    ShieldCheck,
    AlertCircle,
    Package,
    ArrowDownLeft,
    Tag,
    QrCode
} from "lucide-react";
import { useTheme } from "@/components/admin/theme-wrapper";

interface Variant {
    name: string;
    sku: string | null;
}

interface InventoryUnit {
    id: string;
    variant_id: string;
    serial_number: string | null;
    status: string;
    condition_grade: string;
    unit_cost_kes: number;
    source_type: string;
    source_id: string | null;
    created_at: string;
    variant: Variant | null;
}

interface ProvenanceClientProps {
    initialUnits: InventoryUnit[];
}

export default function ProvenanceClient({ initialUnits }: ProvenanceClientProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [units] = useState(initialUnits);
    const [search, setSearch] = useState("");

    const filteredUnits = units.filter(u =>
        (u.variant?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.serial_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.source_type || "").toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return { text: '#22c55e', bg: '#064e3b' };
            case 'sold': return { text: '#3b82f6', bg: '#172554' };
            case 'reserved': return { text: '#f59e0b', bg: '#451a03' };
            case 'damaged': return { text: '#ef4444', bg: '#450a0a' };
            default: return { text: '#94a3b8', bg: '#1e293b' };
        }
    };

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'supplier': return <Database size={14} />;
            case 'trade_in': return <History size={14} />;
            case 'return': return <ArrowDownLeft size={14} />;
            default: return <Tag size={14} />;
        }
    };

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-3 text-blue-500 font-mono text-[10px] font-black tracking-[0.2em] uppercase">
                        <Dna size={14} />
                        <span>Provenance Engine</span>
                    </div>
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-none mb-3">
                        Stock <span className="text-slate-500 italic font-medium">Provenance</span>
                    </h1>
                    <p className="text-slate-500 text-[13px] max-w-lg font-medium leading-relaxed">
                        Deep traceability for every physical unit. Track cost basis, origin, and transition history from procurement to sale.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-[12px] uppercase tracking-wider hover:bg-slate-800 transition-all border border-slate-800 shadow-lg">
                        <QrCode size={14} />
                        Scan Serial
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-[12px] uppercase tracking-wider hover:scale-105 transition-all shadow-xl">
                        <Layers size={14} />
                        Batch Actions
                    </button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Tracked Units", value: units.length, icon: Package, color: "#3b82f6" },
                    { label: "Supplier Sourced", value: units.filter(u => u.source_type === 'supplier').length, icon: Database, color: "#a855f7" },
                    { label: "Trade-in Sourced", value: units.filter(u => u.source_type === 'trade_in').length, icon: History, color: "#f59e0b" },
                    { label: "Asset Value", value: `KES ${new Intl.NumberFormat().format(units.reduce((acc, curr) => acc + (curr.unit_cost_kes || 0), 0))}`, icon: ShieldCheck, color: "#22c55e" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 border border-white/[0.03] rounded-[14px] p-[20px] px-[22px] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center" style={{ color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{stat.label}</div>
                        <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Ledger Table Section */}
            <div className="bg-slate-900/40 border border-white/[0.03] rounded-[14px] overflow-hidden shadow-2xl">
                <div className="p-7 border-b border-white/[0.03] flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Find unit by Serial, Product SKU, or Source..."
                            className="w-full bg-slate-950/80 border border-slate-800/80 py-2.5 px-4 pl-11 rounded-lg text-[13px] font-medium text-foreground focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors">
                            <Filter size={12} />
                            Filters
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.03] bg-slate-900/10">
                                <th className="px-[20px] py-[12px] text-left text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-500">Inventory Unit</th>
                                <th className="px-[20px] py-[12px] text-left text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-500">Provenance Source</th>
                                <th className="px-[20px] py-[12px] text-left text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-500">Cost Basis</th>
                                <th className="px-[20px] py-[12px] text-left text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-500">Status</th>
                                <th className="px-[20px] py-[12px] text-right text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUnits.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-[24px] bg-slate-800/30 flex items-center justify-center">
                                                <AlertCircle size={32} className="text-slate-800" />
                                            </div>
                                            <div className="text-slate-600 text-[13px] font-medium max-w-[220px]">No provenance records match your search parameters.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUnits.map((unit) => {
                                const status = getStatusColor(unit.status);
                                return (
                                    <tr key={unit.id} className="border-b border-white/[0.03] hover:bg-blue-500/[0.02] transition-colors group min-h-[44px]">
                                        <td className="px-5 py-4">
                                            <div className="text-[13px] font-bold text-white mb-1">{unit.variant?.name || "Unknown Variant"}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-white/[0.02]">
                                                    SN: {unit.serial_number || "NO-SERIAL"}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-500/60 font-mono uppercase tracking-tighter">
                                                    {unit.variant?.sku}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                                    {getSourceIcon(unit.source_type)}
                                                </div>
                                                <div>
                                                    <div className="text-[12px] font-bold text-white capitalize">{unit.source_type?.replace('_', ' ')}</div>
                                                    <div className="text-[11px] text-slate-600 font-mono tracking-tighter">ID: {unit.source_id?.split('-')[0] || "MANUAL"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono">
                                            <div className="text-[13px] font-bold text-white">KES {new Intl.NumberFormat().format(unit.unit_cost_kes || 0)}</div>
                                            <div className="text-[10px] font-black text-slate-600 uppercase mt-0.5 tracking-widest">{unit.condition_grade} Grade</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full w-fit border border-transparent shadow-sm group-hover:border-white/[0.05] transition-all font-mono" style={{ background: status.bg, color: status.text }}>
                                                <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: status.text }}></div>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{unit.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="h-8 w-8 rounded-lg bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700 transition-all">
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-7 border-t border-white/[0.03] bg-slate-900/10 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div> Domestic</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div> International</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Database size={12} />
                        Ledger Synced
                    </div>
                </div>
            </div>
        </div>
    );
}
