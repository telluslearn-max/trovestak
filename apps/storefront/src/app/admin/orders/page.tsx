"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
    Search, Download, Package, Clock, CheckCircle2,
    Truck, XCircle, ChevronRight, Calendar, Hash, Filter, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import {
    T, Av, Chip, Card, StatCard, Btn, SInput, TH, TD, fmt, PageHeader
} from "@/components/admin/ui-pro";
import { getOrders, updateOrderStatus } from "./actions";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const setSearchAndReset = (v: string) => { setSearch(v); setPage(1); };
    const setStatusAndReset = (v: string) => { setStatusFilter(v); setPage(1); };
    const [isPending, startTransition] = useTransition();
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (err: any) {
            toast.error(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === "pending").length,
        processing: orders.filter(o => o.status === "processing").length,
        shipped: orders.filter(o => o.status === "shipped").length,
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch =
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            (o.customer_name || o.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
            (o.customer_email || o.profiles?.email || "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "all" || o.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const handlePageChange = (newPage: number) => setPage(Math.max(1, Math.min(newPage, totalPages)));

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <PageHeader title="Orders Registry" sub="Manage cross-channel fulfillment and order processing lifecycle.">
                <Btn variant="ghost" className="h-10 px-6">
                    <Download size={14} /> Export CSV
                </Btn>
            </PageHeader>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Volume" value={String(stats.total)} color={T.blue} icon={Package} sub="Historical Lifetime" />
                <StatCard label="Awaiting Action" value={String(stats.pending)} color={T.orange} icon={Clock} sub="Immediate Response Required" />
                <StatCard label="In Fulfillment" value={String(stats.processing)} color={T.purple} icon={Package} sub="Currently being packed" />
                <StatCard label="Dispatched" value={String(stats.shipped)} color={T.cyan} icon={Truck} sub="Last 24 Hours" />
            </div>

            {/* Main Content Card */}
            <Card className="overflow-hidden border-border/50">
                {/* Filters Top Bar */}
                <div className="p-6 border-b border-border/50 bg-muted/20 flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <SInput
                            value={search}
                            onChange={setSearchAndReset}
                            placeholder="Filter by Order ID, Customer name or Email..."
                            className="pl-12 h-11"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusAndReset(s)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                    statusFilter === s
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-surface border border-border/50 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <div className="grid grid-cols-[1.5fr_2fr_1.5fr_1.2fr_1.2fr_0.5fr] items-center border-b border-border/50 bg-muted/30">
                            <TH>Order Reference</TH>
                            <TH>Customer Identity</TH>
                            <TH>Deployment Logic</TH>
                            <TH>Total Value</TH>
                            <TH>Status</TH>
                            <TH className="text-right">Actions</TH>
                        </div>

                        <div className="divide-y divide-border/30">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="grid grid-cols-[1.5fr_2fr_1.5fr_1.2fr_1.2fr_0.5fr] items-center animate-pulse">
                                            <TD><div className="h-4 bg-muted/40 rounded w-2/3" /></TD>
                                            <TD><div className="h-10 bg-muted/40 rounded-full w-10 mr-3" /><div className="h-4 bg-muted/40 rounded w-1/2" /></TD>
                                            <TD><div className="h-4 bg-muted/40 rounded w-3/4" /></TD>
                                            <TD><div className="h-4 bg-muted/40 rounded w-1/2" /></TD>
                                            <TD><div className="h-6 bg-muted/40 rounded-lg w-20" /></TD>
                                            <TD />
                                        </div>
                                    ))
                                ) : paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((o) => (
                                        <motion.div
                                            key={o.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="grid grid-cols-[1.5fr_2fr_1.5fr_1.2fr_1.2fr_0.5fr] items-center hover:bg-muted/30 transition-colors group"
                                        >
                                            <TD mono className="text-primary font-bold">
                                                <div className="flex flex-col">
                                                    <span>#{o.id.slice(0, 8).toUpperCase()}</span>
                                                    <span className="text-[9px] text-muted-foreground font-normal mt-1 flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(o.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex items-center gap-3">
                                                    <Av l={(o.customer_name || o.profiles?.full_name || "G")[0]} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{o.customer_name || o.profiles?.full_name || "Guest Checkout"}</span>
                                                        <span className="text-[10px] text-muted-foreground">{o.customer_email || o.profiles?.email || "No email"}</span>
                                                    </div>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground">
                                                        <Package size={14} />
                                                    </div>
                                                    <span className="text-xs font-medium">Multiple Assets</span>
                                                </div>
                                            </TD>
                                            <TD mono className="text-lg font-black tracking-tighter">
                                                {fmt(o.total_amount)}
                                            </TD>
                                            <TD>
                                                <Chip s={o.status || "pending"} />
                                            </TD>
                                            <TD className="text-right pr-6">
                                                <Link href={`/admin/orders/${o.id}`}>
                                                    <Btn variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ArrowUpRight size={16} />
                                                    </Btn>
                                                </Link>
                                            </TD>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-[24px] bg-muted/30 flex items-center justify-center">
                                            <Package size={24} className="text-muted-foreground/20" />
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">No order records found targeting the current filter.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border/50 bg-muted/10 flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div>
                        Showing <span className="text-foreground">{Math.min((page - 1) * PAGE_SIZE + 1, filteredOrders.length)}–{Math.min(page * PAGE_SIZE, filteredOrders.length)}</span> of <span className="text-foreground">{filteredOrders.length}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                        <Btn variant="ghost" small disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Previous</Btn>
                        <span className="text-foreground">{page} / {totalPages}</span>
                        <Btn variant="ghost" small disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>Next</Btn>
                    </div>
                </div>
            </Card>
        </div>
    );
}
