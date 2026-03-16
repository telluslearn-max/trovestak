"use client";

import React, { useState, useTransition } from "react";
import { Plus, Trash2, Package, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PageHeader, Card, StatCard, Btn, Chip, T, Av } from "@/components/admin/ui-pro";
import { createTradeInAction, updateTradeInStatusAction, deleteTradeInAction } from "./actions";

interface TradeIn {
    id: string;
    device_name: string;
    device_brand: string | null;
    device_model: string | null;
    condition: "like_new" | "good" | "fair" | "poor";
    quoted_value: number | null;
    final_value: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    status: string;
    notes: string | null;
    created_at: string;
}

interface Props {
    initialTradeIns: TradeIn[];
}

const fmtKES = (n: number) => `KES ${Number(n).toLocaleString()}`;

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
    like_new: { label: "Like New", color: "text-green-400" },
    good: { label: "Good", color: "text-blue-400" },
    fair: { label: "Fair", color: "text-orange-400" },
    poor: { label: "Poor", color: "text-red-400" },
};

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: TradeIn) => void }) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        device_name: "",
        device_brand: "",
        device_model: "",
        condition: "good" as "like_new" | "good" | "fair" | "poor",
        quoted_value: "",
        customer_name: "",
        customer_phone: "",
        notes: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.device_name) { toast.error("Device name is required"); return; }
        startTransition(async () => {
            try {
                const result = await createTradeInAction({
                    device_name: form.device_name,
                    device_brand: form.device_brand || undefined,
                    device_model: form.device_model || undefined,
                    condition: form.condition,
                    quoted_value: form.quoted_value ? Number(form.quoted_value) : undefined,
                    customer_name: form.customer_name || undefined,
                    customer_phone: form.customer_phone || undefined,
                    notes: form.notes || undefined,
                });
                if (result.success) {
                    toast.success("Trade-in intake recorded");
                    onCreated(result.data as TradeIn);
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to create trade-in");
            }
        });
    };

    const fieldClass = "w-full h-10 px-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-5">New Trade-In Intake</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Device Name *</label>
                        <input className={fieldClass} placeholder='e.g. "iPhone 14 Pro"' value={form.device_name} onChange={e => setForm(f => ({ ...f, device_name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Brand</label>
                            <input className={fieldClass} placeholder="Apple" value={form.device_brand} onChange={e => setForm(f => ({ ...f, device_brand: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Model</label>
                            <input className={fieldClass} placeholder="A2650" value={form.device_model} onChange={e => setForm(f => ({ ...f, device_model: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Condition *</label>
                            <select className={fieldClass} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as any }))}>
                                <option value="like_new">Like New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Quoted Value (KES)</label>
                            <input className={fieldClass} type="number" placeholder="0" value={form.quoted_value} onChange={e => setForm(f => ({ ...f, quoted_value: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Customer Name</label>
                            <input className={fieldClass} placeholder="John Mwangi" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Customer Phone</label>
                            <input className={fieldClass} placeholder="+254..." value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Notes</label>
                        <textarea
                            className={`${fieldClass} h-20 resize-none`}
                            placeholder="Condition details, accessories included, etc."
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="button" variant="ghost" small onClick={onClose} className="flex-1">Cancel</Btn>
                        <Btn type="submit" small disabled={isPending} className="flex-1 bg-primary text-white">
                            {isPending ? "Saving..." : "Record Intake"}
                        </Btn>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function TradeInsClient({ initialTradeIns }: Props) {
    const [tradeIns, setTradeIns] = useState(initialTradeIns);
    const [showCreate, setShowCreate] = useState(false);
    const [isPending, startTransition] = useTransition();

    const pending = tradeIns.filter(t => t.status === "pending").length;
    const inspecting = tradeIns.filter(t => t.status === "inspecting").length;
    const approved = tradeIns.filter(t => t.status === "approved").length;

    const handleDelete = (id: string) => {
        if (!confirm("Delete this trade-in record?")) return;
        startTransition(async () => {
            try {
                await deleteTradeInAction(id);
                setTradeIns(prev => prev.filter(t => t.id !== id));
                toast.success("Deleted");
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    const handleStatusChange = (id: string, status: string) => {
        startTransition(async () => {
            try {
                await updateTradeInStatusAction(id, status);
                setTradeIns(prev => prev.map(t => t.id === id ? { ...t, status } : t));
                toast.success(`Status updated to ${status}`);
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(t) => { setTradeIns(prev => [t, ...prev]); setShowCreate(false); }}
                />
            )}

            <PageHeader title="Trade-In Intake" sub="Device buyback and reverse supply chain">
                <Btn small onClick={() => setShowCreate(true)} className="gap-2 bg-primary text-white">
                    <Plus size={13} /> New Intake
                </Btn>
            </PageHeader>

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Pending" value={String(pending)} color={T.orange} icon={Clock} sub="Awaiting inspection" />
                <StatCard label="Inspecting" value={String(inspecting)} color={T.blue} icon={Package} sub="In review" />
                <StatCard label="Approved" value={String(approved)} color={T.green} icon={CheckCircle2} sub="Ready for resale" />
            </div>

            <Card className="overflow-hidden">
                {tradeIns.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Package size={32} className="text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">No trade-ins recorded yet.</p>
                        <Btn small onClick={() => setShowCreate(true)} className="gap-2 bg-primary text-white mt-1">
                            <Plus size={12} /> Record your first intake
                        </Btn>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_80px] px-6 py-3 border-b border-border/30 bg-muted/20">
                            {["Device", "Customer", "Condition", "Quoted", "Final", "Status", ""].map(h => (
                                <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                            ))}
                        </div>
                        <AnimatePresence mode="popLayout">
                            {tradeIns.map(t => {
                                const cond = CONDITION_LABELS[t.condition] || { label: t.condition, color: "text-muted-foreground" };
                                return (
                                    <motion.div
                                        key={t.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="group grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_80px] px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors items-center"
                                    >
                                        <div>
                                            <div className="text-sm font-bold truncate">{t.device_name}</div>
                                            {(t.device_brand || t.device_model) && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    {[t.device_brand, t.device_model].filter(Boolean).join(" · ")}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Av l={t.customer_name || "G"} size={28} />
                                            <div>
                                                <div className="text-xs font-semibold truncate max-w-[110px]">{t.customer_name || "Walk-in"}</div>
                                                <div className="text-[10px] text-muted-foreground">{t.customer_phone || "—"}</div>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold ${cond.color}`}>{cond.label}</div>
                                        <div className="font-mono text-sm">
                                            {t.quoted_value ? fmtKES(t.quoted_value) : <span className="text-muted-foreground/40">—</span>}
                                        </div>
                                        <div className="font-mono text-sm text-green-400">
                                            {t.final_value ? fmtKES(t.final_value) : <span className="text-muted-foreground/40">—</span>}
                                        </div>
                                        <div>
                                            <select
                                                value={t.status}
                                                onChange={e => handleStatusChange(t.id, e.target.value)}
                                                className="text-[10px] font-bold rounded-lg border border-border/40 bg-background px-2 py-1 focus:outline-none"
                                            >
                                                {["pending", "inspecting", "approved", "rejected", "completed"].map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDelete(t.id)} disabled={isPending}>
                                                <Trash2 size={14} className="text-red-400/70 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </>
                )}
            </Card>
        </div>
    );
}
