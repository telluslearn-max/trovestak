"use client";

import React, { useState } from "react";
import {
    RefreshCcw,
    Plus,
    Search,
    Truck,
    ClipboardList,
    ArrowUpRight,
    Calendar,
    DollarSign,
    CheckCircle2,
    Clock,
    XCircle
} from "lucide-react";
import { useTheme } from "@/components/admin/theme-wrapper";

interface Supplier {
    name: string;
    display_name: string | null;
}

interface PurchaseOrder {
    id: string;
    status: string;
    total_cost_kes: number;
    created_at: string;
    notes: string | null;
    supplier: Supplier | null;
}

interface PurchaseOrdersClientProps {
    initialOrders: PurchaseOrder[];
}

export default function PurchaseOrdersClient({ initialOrders }: PurchaseOrdersClientProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [orders] = useState(initialOrders);
    const [search, setSearch] = useState("");

    const filteredOrders = orders.filter(o =>
        (o.supplier?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.notes || "").toLowerCase().includes(search.toLowerCase())
    );

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'received': return { icon: CheckCircle2, text: '#22c55e', bg: '#064e3b', label: 'Received' };
            case 'ordered': return { icon: Truck, text: '#3b82f6', bg: '#172554', label: 'In Transit' };
            case 'draft': return { icon: ClipboardList, text: '#94a3b8', bg: '#1e293b', label: 'Draft' };
            case 'cancelled': return { icon: XCircle, text: '#ef4444', bg: '#450a0a', label: 'Cancelled' };
            case 'partially_received': return { icon: Clock, text: '#f59e0b', bg: '#451a03', label: 'Partial' };
            default: return { icon: RefreshCcw, text: '#94a3b8', bg: '#1e293b', label: status };
        }
    };

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-3 text-orange-500 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                        <RefreshCcw size={14} />
                        <span>Procurement Pipeline</span>
                    </div>
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground mb-2">
                        Purchase <span className="text-slate-500 italic font-medium">Orders</span>
                    </h1>
                    <p className="text-slate-500 text-[13px] max-w-lg font-medium opacity-80">
                        Track official procurement cycles with suppliers. Handle document generation, shipping status, and stock receipt synchronization.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl">
                        <Plus size={16} strokeWidth={3} />
                        Create Purchase Order
                    </button>
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Active Orders", value: orders.filter(o => o.status === 'ordered').length, icon: Truck, color: "#3b82f6" },
                    { label: "Draft POs", value: orders.filter(o => o.status === 'draft').length, icon: ClipboardList, color: "#94a3b8" },
                    { label: "Pending Receiving", value: orders.filter(o => o.status === 'partially_received').length, icon: Clock, color: "#f59e0b" },
                    { label: "Pipeline Value", value: `KES ${new Intl.NumberFormat().format(orders.reduce((acc, curr) => acc + (curr.total_cost_kes || 0), 0))}`, icon: DollarSign, color: "#22c55e" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/80 rounded-[14px] p-[20px] px-[22px]">
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon size={20} style={{ color: stat.color }} />
                            <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-[32px] overflow-hidden">
                <div className="p-6 border-b border-slate-800/80 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Filter POs by supplier or reference..."
                            className="w-full bg-slate-950/50 border-none py-3 pl-11 pr-4 rounded-2xl text-sm font-medium text-foreground focus:ring-1 focus:ring-orange-500/50 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-800/50 bg-slate-900/20">
                                <th className="px-[20px] py-[12px] text-[11px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">PO Number & Date</th>
                                <th className="px-[20px] py-[12px] text-[11px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">Supplier Account</th>
                                <th className="px-[20px] py-[12px] text-[11px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">Volume & Value</th>
                                <th className="px-[20px] py-[12px] text-[11px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">Transit Status</th>
                                <th className="px-[20px] py-[12px] text-right text-[11px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center text-slate-600 font-medium">No purchase orders found in the system.</td>
                                </tr>
                            ) : filteredOrders.map((order) => {
                                const status = getStatusInfo(order.status);
                                return (
                                    <tr key={order.id} className="border-b border-slate-800/30 hover:bg-zinc-800/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-white mb-1">#{order.id.split('-')[0].toUpperCase()}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                                                <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs uppercase">
                                                    {order.supplier?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white">{order.supplier?.display_name || order.supplier?.name}</div>
                                                    <div className="text-[10px] text-slate-500 tracking-tight font-medium">Verified Partner</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-white font-mono">KES {new Intl.NumberFormat().format(order.total_cost_kes || 0)}</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Sourcing</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full w-fit group-hover:scale-105 transition-transform cursor-pointer" style={{ background: status.bg, color: status.text }}>
                                                <status.icon size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{status.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
