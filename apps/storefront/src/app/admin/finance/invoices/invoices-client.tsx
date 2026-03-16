"use client";

import React, { useState } from "react";
import { Printer, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, Btn, T, PageHeader, Chip, Av } from "@/components/admin/ui-pro";

interface Order {
    id: string;
    customer_name: string | null;
    customer_phone: string | null;
    total_amount: number;
    payment_status: string;
    payment_method: string | null;
    status: string;
    created_at: string;
}

interface Props {
    initialOrders: Order[];
}

const fmtKES = (n: number) => `KES ${Number(n).toLocaleString()}`;

function printInvoice(order: Order, invNum: string) {
    const html = `
        <html><head><title>Invoice ${invNum}</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 580px; margin: 40px auto; font-size: 13px; color: #1d1d1f; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6e6e73; margin-bottom: 4px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .total { font-weight: 700; font-size: 16px; }
            .footer { margin-top: 32px; font-size: 11px; color: #6e6e73; text-align: center; }
        </style></head>
        <body>
            <div class="header">
                <div>
                    <div style="font-size:22px;font-weight:900;letter-spacing:-.02em;">TROVESTAK</div>
                    <div style="font-size:11px;color:#6e6e73;">Best Buy of East Africa</div>
                </div>
                <div style="text-align:right;">
                    <div class="label">Invoice</div>
                    <div style="font-size:18px;font-weight:800;">${invNum}</div>
                    <div style="font-size:11px;color:#6e6e73;">${new Date(order.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" })}</div>
                </div>
            </div>
            <div style="margin-bottom:24px;">
                <div class="label">Bill To</div>
                <div style="font-weight:700;">${order.customer_name || "Guest Customer"}</div>
                <div style="color:#6e6e73;">${order.customer_phone || ""}</div>
            </div>
            <div class="row total"><span>Total Amount</span><span>${fmtKES(order.total_amount)}</span></div>
            <div class="row"><span>Payment Method</span><span>${(order.payment_method || "").replace(/_/g, " ").toUpperCase() || "—"}</span></div>
            <div class="row"><span>Payment Status</span><span>${order.payment_status.toUpperCase()}</span></div>
            <div class="footer">Trovestak Ltd · Nairobi, Kenya · support@trovestak.com</div>
        </body></html>
    `;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export default function InvoicesClient({ initialOrders }: Props) {
    const [search, setSearch] = useState("");

    const filtered = initialOrders.filter(o => {
        const name = (o.customer_name || "").toLowerCase();
        const id = o.id.toLowerCase();
        return !search || name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    });

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <PageHeader title="Invoices" sub="Customer billing records and print receipts" />

            <Card className="overflow-hidden">
                <div className="p-5 border-b border-border/40 bg-muted/10">
                    <div className="relative max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search customer or order ID..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={13} className="text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_80px] px-6 py-3 border-b border-border/30 bg-muted/20">
                    {["Invoice #", "Customer", "Amount", "Date", "Status", ""].map(h => (
                        <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                    ))}
                </div>

                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">No invoices found.</div>
                    ) : filtered.map((o, i) => {
                        const invNum = `#INV-${String(Date.parse(o.created_at)).slice(-5)}`;
                        return (
                            <motion.div
                                key={o.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_80px] px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors items-center group"
                            >
                                <div className="font-mono text-[11px] font-bold text-primary">{invNum}</div>
                                <div className="flex items-center gap-2">
                                    <Av l={o.customer_name || "G"} size={28} />
                                    <div>
                                        <div className="text-xs font-semibold truncate max-w-[130px]">{o.customer_name || "Guest"}</div>
                                        <div className="text-[10px] text-muted-foreground">{o.customer_phone || "—"}</div>
                                    </div>
                                </div>
                                <div className="font-mono font-bold text-sm">{fmtKES(o.total_amount)}</div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(o.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "2-digit" })}
                                </div>
                                <div>
                                    <Chip s={o.payment_status} />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => printInvoice(o, invNum)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted/50 rounded-lg"
                                        title="Print invoice"
                                    >
                                        <Printer size={14} className="text-muted-foreground" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                <div className="px-6 py-4 border-t border-border/30 bg-muted/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {filtered.length} invoices
                </div>
            </Card>
        </div>
    );
}
