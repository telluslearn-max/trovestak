"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, Search, Edit2, X, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    T, Av, Chip, Card, StatCard, Btn, PageHeader
} from "@/components/admin/ui-pro";
import type { FinanceSummary, ReconciliationOrder, RevenueDay } from "../actions";
import { updateMpesaReceiptAction } from "../actions";

interface Props {
    summary: FinanceSummary;
    orders: ReconciliationOrder[];
    revenueData: RevenueDay[];
}

const fmtKES = (n: number) => `KES ${Number(n).toLocaleString()}`;

function MiniBarChart({ data }: { data: RevenueDay[] }) {
    if (data.length === 0) return <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">No data</div>;
    const max = Math.max(...data.map(d => d.total));
    return (
        <div className="flex items-end gap-0.5 h-16">
            {data.slice(-30).map((d) => {
                const pct = max > 0 ? (d.total / max) * 100 : 0;
                return (
                    <div
                        key={d.date}
                        title={`${d.date}: KES ${Number(d.total).toLocaleString()} (${d.count} orders)`}
                        className="flex-1 rounded-sm cursor-help transition-opacity hover:opacity-80"
                        style={{
                            height: `${Math.max(pct, 4)}%`,
                            background: `var(--admin-green)`,
                            opacity: pct > 0 ? 0.4 + (pct / 100) * 0.6 : 0.15,
                        }}
                    />
                );
            })}
        </div>
    );
}

function ReceiptEditor({ order, onSave }: {
    order: ReconciliationOrder;
    onSave: (receipt: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(order.mpesa_receipt_number || "");
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (!value.trim()) return;
        startTransition(async () => {
            try {
                await updateMpesaReceiptAction(order.id, value.trim());
                onSave(value.trim());
                toast.success("Receipt number saved");
                setEditing(false);
            } catch (err: any) {
                toast.error(err.message || "Failed to save receipt");
            }
        });
    };

    if (!editing) {
        return (
            <div className="flex items-center gap-2">
                {order.mpesa_receipt_number ? (
                    <span className="font-mono text-xs font-bold text-green-400">
                        {order.mpesa_receipt_number}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground/50 italic">Not matched</span>
                )}
                <button
                    onClick={() => setEditing(true)}
                    className="p-1 hover:bg-muted/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Edit2 size={11} className="text-muted-foreground" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <input
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value.toUpperCase())}
                placeholder="e.g. RHG4XKML5D"
                className="w-32 h-7 px-2 rounded-lg border border-border/60 bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                onKeyDown={e => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") setEditing(false);
                }}
            />
            <button
                onClick={handleSave}
                disabled={isPending}
                className="text-[10px] font-bold text-green-400 hover:text-green-300"
            >
                Save
            </button>
            <button onClick={() => setEditing(false)}>
                <X size={11} className="text-muted-foreground" />
            </button>
        </div>
    );
}

export default function ReconciliationClient({ summary, orders: initialOrders, revenueData }: Props) {
    const [orders, setOrders] = useState(initialOrders);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

    const handleReceiptSaved = (orderId: string, receipt: string) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, mpesa_receipt_number: receipt, payment_status: "paid" } : o
        ));
    };

    const filtered = orders.filter(o => {
        const name = (o.customer_name || "").toLowerCase();
        const phone = (o.customer_phone || "").toLowerCase();
        const id = o.id.toLowerCase();
        const receipt = (o.mpesa_receipt_number || "").toLowerCase();
        const matchSearch = !search || name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || receipt.includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "matched" && !!o.mpesa_receipt_number) ||
            (filter === "unmatched" && !o.mpesa_receipt_number);
        return matchSearch && matchFilter;
    });

    const unmatchedCount = orders.filter(o => !o.mpesa_receipt_number).length;
    const matchedCount = orders.filter(o => !!o.mpesa_receipt_number).length;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <PageHeader
                title="M-Pesa Reconciliation"
                sub="Match receipts to orders and verify daily revenue"
            >
                {unmatchedCount > 0 && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {unmatchedCount} unmatched
                    </span>
                )}
            </PageHeader>

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Gross Revenue"
                    value={`KES ${(summary.grossRevenue / 1000).toFixed(0)}k`}
                    color={T.green}
                    icon={TrendingUp}
                    sub={`${summary.paidOrderCount} paid orders`}
                />
                <StatCard
                    label="M-Pesa"
                    value={`KES ${(summary.mpesaRevenue / 1000).toFixed(0)}k`}
                    color={T.cyan}
                    iconChar="📱"
                    sub="Mobile money"
                />
                <StatCard
                    label="Unreconciled"
                    value={String(unmatchedCount)}
                    color={T.orange}
                    icon={AlertCircle}
                    sub="Missing M-Pesa receipts"
                />
                <StatCard
                    label="Avg Order"
                    value={`KES ${(summary.avgOrderValue / 1000).toFixed(1)}k`}
                    color={T.purple}
                    iconChar="◆"
                    sub="Per paid order"
                />
            </div>

            {/* Revenue Chart */}
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-sm font-bold">Daily Revenue — Last 30 Days</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">M-Pesa paid orders only</div>
                    </div>
                </div>
                <MiniBarChart data={revenueData} />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-2 font-mono">
                    {revenueData.length > 0 && (
                        <>
                            <span>{revenueData[0]?.date}</span>
                            <span>{revenueData[revenueData.length - 1]?.date}</span>
                        </>
                    )}
                </div>
            </Card>

            {/* Reconciliation Table */}
            <Card className="overflow-hidden">
                {/* Filter bar */}
                <div className="p-5 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/10">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search order, customer, receipt..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={13} className="text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {(["all", "matched", "unmatched"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    filter === f
                                        ? "bg-primary text-white shadow-sm"
                                        : "border border-border/50 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {f} ({f === "all" ? orders.length : f === "matched" ? matchedCount : unmatchedCount})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1.4fr_1fr] px-6 py-3 border-b border-border/30 bg-muted/20">
                    {["Order", "Customer", "Date", "Amount", "M-Pesa Receipt", "Status"].map(h => (
                        <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                    ))}
                </div>

                <div>
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center flex flex-col items-center gap-3">
                            <CheckCircle2 size={28} className="text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground">
                                {search ? "No orders match your search." : "All M-Pesa orders reconciled!"}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map(order => (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "group grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1.4fr_1fr] px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors items-center",
                                        !order.mpesa_receipt_number && "border-l-2 border-l-orange-400/50"
                                    )}
                                >
                                    <div className="font-mono text-[11px] font-bold text-primary">
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Av l={order.customer_name || "G"} size={28} />
                                        <div>
                                            <div className="text-xs font-semibold truncate max-w-[130px]">
                                                {order.customer_name || "Guest"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">{order.customer_phone || "No phone"}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}
                                    </div>
                                    <div className="font-mono font-bold text-sm">
                                        {fmtKES(order.total_amount)}
                                    </div>
                                    <ReceiptEditor
                                        order={order}
                                        onSave={(receipt) => handleReceiptSaved(order.id, receipt)}
                                    />
                                    <div>
                                        <Chip s={order.mpesa_receipt_number ? "active" : "pending"} label={order.mpesa_receipt_number ? "Matched" : "Unmatched"} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-border/30 bg-muted/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {filtered.length} of {orders.length} M-Pesa orders
                </div>
            </Card>
        </div>
    );
}
