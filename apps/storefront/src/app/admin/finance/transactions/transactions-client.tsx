"use client";

import React, { useState } from "react";
import { Download, Search, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatCard, Card, Btn, T, PageHeader, Chip, Av } from "@/components/admin/ui-pro";

interface Transaction {
    id: string;
    customer_name: string | null;
    customer_phone: string | null;
    total_amount: number;
    payment_method: string | null;
    payment_status: string;
    mpesa_receipt_number: string | null;
    created_at: string;
}

interface Props {
    initialTransactions: Transaction[];
    initialStats: { total: number; mpesa: number; other: number };
}

const fmtKES = (n: number) => `KES ${Number(n).toLocaleString()}`;

const METHOD_LABELS: Record<string, string> = {
    mpesa: "M-Pesa",
    manual_till: "Till",
    cod: "Cash",
    cash_on_delivery: "Cash",
};

function exportCSV(rows: Transaction[]) {
    const header = "Order ID,Customer,Phone,Amount (KES),Method,Receipt,Status,Date";
    const lines = rows.map(r => [
        r.id,
        r.customer_name || "Guest",
        r.customer_phone || "",
        r.total_amount,
        r.payment_method || "",
        r.mpesa_receipt_number || "",
        r.payment_status,
        new Date(r.created_at).toISOString(),
    ].join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trovestak-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function TransactionsClient({ initialTransactions, initialStats }: Props) {
    const [transactions] = useState(initialTransactions);
    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");

    const filtered = transactions.filter(t => {
        const name = (t.customer_name || "").toLowerCase();
        const phone = (t.customer_phone || "").toLowerCase();
        const id = t.id.toLowerCase();
        const receipt = (t.mpesa_receipt_number || "").toLowerCase();
        const matchSearch = !search || name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || receipt.includes(search.toLowerCase());
        const matchMethod = methodFilter === "all" || t.payment_method === methodFilter;
        return matchSearch && matchMethod;
    });

    const methods = ["all", "mpesa", "manual_till", "cod"];

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <PageHeader title="Transactions" sub="All payment records across channels">
                <Btn variant="ghost" small onClick={() => exportCSV(transactions)} className="gap-2">
                    <Download size={13} />
                    Export CSV
                </Btn>
            </PageHeader>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Total Revenue"
                    value={`KES ${(initialStats.total / 1000).toFixed(0)}k`}
                    color={T.green}
                    icon={TrendingUp}
                    sub={`${transactions.filter(t => t.payment_status === "paid").length} paid`}
                />
                <StatCard
                    label="M-Pesa"
                    value={`KES ${(initialStats.mpesa / 1000).toFixed(0)}k`}
                    color={T.cyan}
                    iconChar="📱"
                    sub="Mobile money volume"
                />
                <StatCard
                    label="Other Methods"
                    value={`KES ${(initialStats.other / 1000).toFixed(0)}k`}
                    color={T.blue}
                    iconChar="💳"
                    sub="Till + COD"
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
                            placeholder="Search order, name, receipt..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={13} className="text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {methods.map(m => (
                            <button
                                key={m}
                                onClick={() => setMethodFilter(m)}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    methodFilter === m
                                        ? "bg-primary text-white"
                                        : "border border-border/50 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {m === "all" ? "All" : METHOD_LABELS[m] || m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Header */}
                <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr] px-6 py-3 border-b border-border/30 bg-muted/20">
                    {["Order", "Customer", "Date", "Amount", "Method", "Receipt", "Status"].map(h => (
                        <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                    ))}
                </div>

                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">No transactions found.</div>
                    ) : filtered.map(t => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr] px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors items-center"
                        >
                            <div className="font-mono text-[11px] font-bold text-primary">
                                #{t.id.slice(0, 8).toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Av l={t.customer_name || "G"} size={28} />
                                <div>
                                    <div className="text-xs font-semibold truncate max-w-[130px]">{t.customer_name || "Guest"}</div>
                                    <div className="text-[10px] text-muted-foreground">{t.customer_phone || "—"}</div>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(t.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "2-digit" })}
                            </div>
                            <div className="font-mono font-bold text-sm">{fmtKES(t.total_amount)}</div>
                            <div>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg border border-border/40 text-muted-foreground">
                                    {METHOD_LABELS[t.payment_method || ""] || t.payment_method || "—"}
                                </span>
                            </div>
                            <div className="font-mono text-xs text-green-400 truncate">
                                {t.mpesa_receipt_number || <span className="text-muted-foreground/40 not-italic">—</span>}
                            </div>
                            <div>
                                <Chip s={t.payment_status} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <div className="px-6 py-4 border-t border-border/30 bg-muted/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {filtered.length} of {transactions.length} transactions
                </div>
            </Card>
        </div>
    );
}
