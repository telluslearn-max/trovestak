"use client";

import { useState } from "react";
import {
    Package,
    ChevronRight,
    Search,
    Filter,
    FileText,
    Download,
    Calendar,
    Hash,
    Sparkles,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrdersClientProps {
    initialOrders: any[];
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
    const [orders] = useState(initialOrders);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-background selection:bg-primary/20">
            <div className="max-w-6xl mx-auto">
                {/* Navigation & Breadcrumbs */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <Link href="/account" className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Return to Hub
                    </Link>
                </motion.div>

                {/* Header Section */}
                <header className="mb-20">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                <Package className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Deployment Records</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-4">
                                Acquisition <span className="text-muted-foreground/40 italic font-serif">Log.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl">
                                Detailed chronological history of your equipment deployments and transactions.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto"
                        >
                            <div className="relative w-full sm:w-80 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH BY ID OR STATUS"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-muted/30 border border-apple-border dark:border-apple-border-dark rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                                />
                            </div>
                            <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-muted/30 text-foreground font-black uppercase tracking-widest text-[10px] border border-apple-border dark:border-apple-border-dark hover:bg-muted/50 transition-all w-full sm:w-auto justify-center">
                                <Filter className="w-4 h-4" />
                                Advanced Filter
                            </button>
                        </motion.div>
                    </div>
                </header>

                {/* Orders Grid/List */}
                <div className="space-y-8">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, idx) => (
                            <OrderCard key={order.id} order={order} index={idx} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-40 glass-card rounded-[3rem] border border-dashed border-apple-border dark:border-apple-border-dark flex flex-col items-center"
                        >
                            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center text-muted-foreground/20 mb-8">
                                <Package className="w-12 h-12" strokeWidth={1} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-foreground mb-4 uppercase">Void Records</h2>
                            <p className="text-muted-foreground font-medium mb-12 max-w-sm mx-auto leading-relaxed px-6">
                                Your acquisition history is currently empty. Initialize your first equipment deployment from the storefront.
                            </p>
                            <Link
                                href="/store"
                                className="inline-flex items-center gap-3 px-12 py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-foreground/20"
                            >
                                <Sparkles className="w-4 h-4" />
                                Begin Acquisition
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderCard({ order, index }: { order: any, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative glass-card rounded-[2.5rem] p-8 md:p-10 border border-apple-border dark:border-apple-border-dark hover:border-primary/20 transition-all overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />

            <div className="flex flex-col lg:flex-row justify-between gap-10">
                {/* Order Identity & Meta */}
                <div className="space-y-8">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-foreground text-background rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 py-0.5 bg-muted/40 rounded-md">ID Record</span>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">
                                    TRV-{order.id.slice(0, 8).toUpperCase()}
                                </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4 opacity-40" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString("en-KE", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Hash className="w-4 h-4 opacity-40" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{order.order_items?.length || 0} UNITS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Peek of Items (Icons only) */}
                    <div className="flex items-center gap-3">
                        {Array.from({ length: Math.min(order.order_items?.length || 0, 4) }).map((_, i) => (
                            <div key={i} className="w-10 h-10 rounded-xl bg-muted/30 border border-apple-border dark:border-apple-border-dark flex items-center justify-center text-muted-foreground/30 ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                                <Package className="w-4 h-4" />
                            </div>
                        ))}
                        {order.order_items?.length > 4 && (
                            <span className="text-[10px] font-black text-muted-foreground ml-2">+{order.order_items.length - 4} MORE</span>
                        )}
                    </div>
                </div>

                {/* Status & Financials */}
                <div className="flex flex-row lg:flex-col justify-between items-end lg:items-end gap-6 pt-6 lg:pt-0 border-t lg:border-t-0 border-apple-border dark:border-apple-border-dark">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Acquisition Value</p>
                        <p className="text-4xl font-black text-foreground tracking-tighter">
                            <span className="text-lg opacity-40 mr-1 font-medium">KES</span>
                            {order.total_amount.toLocaleString()}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <span className={cn(
                            "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm",
                            order.status === 'completed'
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                        )}>
                            {order.status}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Ledger Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-10 pt-8 border-t border-apple-border dark:border-apple-border-dark flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-4 py-2 bg-muted/20 rounded-xl group/btn">
                        <FileText className="w-4 h-4 group-hover/btn:text-primary transition-colors" />
                        Order Breakdown
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white hover:bg-primary transition-all px-4 py-2 bg-primary/5 rounded-xl border border-primary/20">
                        <Download className="w-4 h-4" />
                        eTIMS Invoice
                    </button>
                </div>

                <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-2 group/link"
                >
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">MANAGE DEPLOYMENT</span>
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center group-hover/link:translate-x-2 transition-all duration-300">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </Link>
            </div>
        </motion.div>
    );
}
