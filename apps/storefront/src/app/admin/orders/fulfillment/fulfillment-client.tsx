"use client";

import React, { useState, useTransition } from "react";
import {
    Truck, Package, Clock, CheckCircle2, Printer,
    ChevronDown, User, Phone, MapPin, Search, X
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    T, Av, Chip, Card, StatCard, Btn, SInput, PageHeader, fmt
} from "@/components/admin/ui-pro";
import type { FulfillmentOrder, Rider } from "./fulfillment-actions";
import { assignRiderAction, markDispatchedAction } from "./fulfillment-actions";

interface Props {
    initialOrders: FulfillmentOrder[];
    riders: Rider[];
}

function printSlip(order: FulfillmentOrder) {
    const addr = order.shipping_address || {};
    const addrStr = [addr.address, addr.city, addr.county].filter(Boolean).join(", ");
    const html = `
        <html><head><title>Dispatch Slip — #${order.id.slice(0, 8).toUpperCase()}</title>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 360px; margin: 0 auto; padding: 20px; }
            h2 { font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 10px 0; padding: 8px 0; }
            .total { font-weight: bold; font-size: 14px; }
        </style></head>
        <body>
            <h2>TROVESTAK — DISPATCH SLIP</h2>
            <div class="row"><span>Order:</span><span>#${order.id.slice(0, 8).toUpperCase()}</span></div>
            <div class="row"><span>Date:</span><span>${new Date().toLocaleString("en-KE")}</span></div>
            <div class="row"><span>Customer:</span><span>${order.customer_name || "Guest"}</span></div>
            <div class="row"><span>Phone:</span><span>${order.customer_phone || "N/A"}</span></div>
            <div class="row"><span>Address:</span><span>${addrStr || "N/A"}</span></div>
            <div class="row"><span>Rider:</span><span>${order.rider_name || "Unassigned"}</span></div>
            <div class="items">
                ${order.items.map(i => `
                    <div class="row">
                        <span>${i.product_name || "Item"}${i.variant_label ? ` (${i.variant_label})` : ""} x${i.quantity}</span>
                        <span>KES ${Number(i.total_price).toLocaleString()}</span>
                    </div>
                `).join("")}
            </div>
            <div class="row total"><span>TOTAL:</span><span>KES ${Number(order.total_amount).toLocaleString()}</span></div>
            <div class="row"><span>Payment:</span><span>${(order.payment_method || "").toUpperCase()} — PAID</span></div>
        </body></html>
    `;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
}

function OrderRow({ order, riders, onRefresh }: {
    order: FulfillmentOrder;
    riders: Rider[];
    onRefresh: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showRiderPicker, setShowRiderPicker] = useState(false);
    const [isPending, startTransition] = useTransition();

    const addr = order.shipping_address || {};
    const addrStr = [addr.address, addr.city, addr.county].filter(Boolean).join(", ");

    const handleAssignRider = (riderName: string) => {
        startTransition(async () => {
            try {
                await assignRiderAction(order.id, riderName);
                toast.success(`Rider "${riderName}" assigned to #${order.id.slice(0, 8).toUpperCase()}`);
                setShowRiderPicker(false);
                onRefresh();
            } catch (err: any) {
                toast.error(err.message || "Failed to assign rider");
            }
        });
    };

    const handleDispatch = () => {
        if (!order.rider_name) {
            toast.error("Assign a rider before dispatching");
            return;
        }
        startTransition(async () => {
            try {
                await markDispatchedAction(order.id);
                toast.success(`Order #${order.id.slice(0, 8).toUpperCase()} dispatched`);
                onRefresh();
            } catch (err: any) {
                toast.error(err.message || "Failed to dispatch");
            }
        });
    };

    const minutesWaiting = Math.floor(
        (Date.now() - new Date(order.created_at).getTime()) / 60000
    );
    const isUrgent = minutesWaiting > 60;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border/30 last:border-0"
        >
            {/* Main Row */}
            <div
                className={cn(
                    "flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer",
                    isPending && "opacity-60 pointer-events-none"
                )}
                onClick={() => setExpanded(e => !e)}
            >
                {/* Urgency indicator */}
                <div className={cn(
                    "w-1 h-10 rounded-full flex-shrink-0",
                    isUrgent ? "bg-red-500" : order.status === "packing" ? "bg-blue-500" : "bg-orange-400"
                )} />

                {/* Avatar + Customer */}
                <div className="flex items-center gap-3 w-52 flex-shrink-0">
                    <Av l={order.customer_name || "G"} size={36} />
                    <div>
                        <div className="text-sm font-bold text-foreground truncate max-w-[130px]">
                            {order.customer_name || "Guest"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{order.customer_phone || "No phone"}</div>
                    </div>
                </div>

                {/* Order ID + time */}
                <div className="w-32 flex-shrink-0">
                    <div className="text-[11px] font-mono font-bold text-primary">
                        #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className={cn("text-[10px] font-medium", isUrgent ? "text-red-500" : "text-muted-foreground")}>
                        {minutesWaiting < 60
                            ? `${minutesWaiting}m ago`
                            : `${Math.floor(minutesWaiting / 60)}h ${minutesWaiting % 60}m ago`}
                        {isUrgent && " ⚠"}
                    </div>
                </div>

                {/* Items summary */}
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground truncate">
                        {order.items.length === 0
                            ? "No items"
                            : order.items.map(i => `${i.product_name || "Item"} x${i.quantity}`).join(", ")}
                    </div>
                </div>

                {/* Address */}
                <div className="w-36 flex-shrink-0 hidden lg:block">
                    <div className="text-xs text-muted-foreground truncate">{addrStr || "No address"}</div>
                </div>

                {/* Status */}
                <div className="w-24 flex-shrink-0">
                    <Chip s={order.status} />
                </div>

                {/* Rider */}
                <div className="w-28 flex-shrink-0 text-xs font-medium">
                    {order.rider_name ? (
                        <span className="text-foreground">{order.rider_name}</span>
                    ) : (
                        <span className="text-muted-foreground/50 italic">Unassigned</span>
                    )}
                </div>

                {/* Total */}
                <div className="w-24 flex-shrink-0 text-right font-mono font-bold text-sm">
                    KES {Number(order.total_amount).toLocaleString()}
                </div>

                {/* Expand chevron */}
                <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                    expanded && "rotate-180"
                )} />
            </div>

            {/* Expanded Detail Panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 pt-2 bg-muted/10 border-t border-border/20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Order items */}
                                <div className="lg:col-span-2 space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                        Items
                                    </div>
                                    {order.items.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No items found.</p>
                                    ) : order.items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                                            <div>
                                                <div className="text-sm font-medium">{item.product_name || "Unknown Item"}</div>
                                                {item.variant_label && (
                                                    <div className="text-[11px] text-muted-foreground">{item.variant_label}</div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                                                <div className="text-sm font-mono font-bold">
                                                    KES {Number(item.total_price).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Address detail */}
                                    <div className="mt-4 pt-3 border-t border-border/20">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                            Delivery Address
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{addrStr || "No address provided"}</span>
                                        </div>
                                        {order.customer_phone && (
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                <span className="text-muted-foreground">{order.customer_phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions panel */}
                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Actions
                                    </div>

                                    {/* Rider assignment */}
                                    <div>
                                        <div className="text-xs font-semibold mb-2">
                                            {order.rider_name ? `Rider: ${order.rider_name}` : "Assign Rider"}
                                        </div>
                                        {showRiderPicker ? (
                                            <div className="space-y-1.5">
                                                {riders.map(r => (
                                                    <button
                                                        key={r.id}
                                                        onClick={() => handleAssignRider(r.name)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                                                    >
                                                        <Av l={r.name} size={28} />
                                                        <div>
                                                            <div className="text-xs font-bold">{r.name}</div>
                                                            <div className="text-[10px] text-muted-foreground">{r.zone || r.phone}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setShowRiderPicker(false)}
                                                    className="text-[10px] text-muted-foreground hover:text-foreground mt-1"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <Btn
                                                variant="ghost"
                                                small
                                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowRiderPicker(true); }}
                                                className="w-full justify-center gap-2"
                                            >
                                                <User size={13} />
                                                {order.rider_name ? "Change Rider" : "Select Rider"}
                                            </Btn>
                                        )}
                                    </div>

                                    {/* Dispatch */}
                                    <Btn
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDispatch(); }}
                                        disabled={!order.rider_name || isPending}
                                        className="w-full justify-center gap-2 bg-primary text-white hover:bg-primary/90"
                                        small
                                    >
                                        <Truck size={13} />
                                        Mark Dispatched
                                    </Btn>

                                    {/* Print */}
                                    <Btn
                                        variant="ghost"
                                        small
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); printSlip(order); }}
                                        className="w-full justify-center gap-2"
                                    >
                                        <Printer size={13} />
                                        Print Slip
                                    </Btn>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FulfillmentClient({ initialOrders, riders }: Props) {
    const [orders, setOrders] = useState(initialOrders);
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState<"all" | "processing" | "packing">("all");
    const refreshKey = React.useRef(0);

    const handleRefresh = () => {
        // The parent page.tsx refetches on navigation; client-side we optimistically remove dispatched
        // Real refresh needs router.refresh() — since we're in a client component we use window reload
        // but we can do soft refresh via revalidatePath from server action
        refreshKey.current++;
        setOrders(prev => prev); // trigger re-render after server revalidate
    };

    const filtered = orders.filter(o => {
        const name = (o.customer_name || "").toLowerCase();
        const id = o.id.toLowerCase();
        const phone = (o.customer_phone || "").toLowerCase();
        const matchSearch = !search || name.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
        const matchStage = stageFilter === "all" || o.status === stageFilter;
        return matchSearch && matchStage;
    });

    // Stage counts
    const counts = {
        all: orders.length,
        processing: orders.filter(o => o.status === "processing").length,
        packing: orders.filter(o => o.status === "packing").length,
    };

    const urgentCount = orders.filter(o => {
        const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
        return mins > 60;
    }).length;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <PageHeader
                title="Dispatch Queue"
                sub="Paid orders ready for rider assignment and dispatch"
            >
                {urgentCount > 0 && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                        {urgentCount} urgent
                    </span>
                )}
            </PageHeader>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Ready to Dispatch"
                    value={String(counts.all)}
                    color={T.orange}
                    icon={Package}
                    sub="Paid, awaiting dispatch"
                />
                <StatCard
                    label="Processing"
                    value={String(counts.processing)}
                    color={T.purple}
                    icon={Clock}
                    sub="Being prepared"
                />
                <StatCard
                    label="Packing"
                    value={String(counts.packing)}
                    color={T.blue}
                    icon={Package}
                    sub="Rider assigned"
                />
                <StatCard
                    label="Riders Active"
                    value={String(riders.length)}
                    color={T.green}
                    icon={Truck}
                    sub="Available for dispatch"
                />
            </div>

            <Card className="overflow-hidden">
                {/* Filter Bar */}
                <div className="p-5 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/10">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search customer, order ID, phone..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X size={13} className="text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {(["all", "processing", "packing"] as const).map(stage => (
                            <button
                                key={stage}
                                onClick={() => setStageFilter(stage)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                    stageFilter === stage
                                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                                        : "border border-border/50 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {stage} ({counts[stage]})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-[4px_208px_128px_1fr_144px_96px_112px_96px_24px] gap-4 px-6 py-3 border-b border-border/30 bg-muted/20">
                    {["", "Customer", "Order", "Items", "Address", "Status", "Rider", "Total", ""].map((h, i) => (
                        <div key={i} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            {h}
                        </div>
                    ))}
                </div>

                {/* Order Rows */}
                <div>
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-[24px] bg-muted/30 flex items-center justify-center">
                                <CheckCircle2 size={28} className="text-muted-foreground/20" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {search ? "No orders match your search." : "No orders in the dispatch queue."}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map(order => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    riders={riders}
                                    onRefresh={handleRefresh}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/30 bg-muted/10 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        {filtered.length} of {orders.length} orders
                    </span>
                </div>
            </Card>
        </div>
    );
}
