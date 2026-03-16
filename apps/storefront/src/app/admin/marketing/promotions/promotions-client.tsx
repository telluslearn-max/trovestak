"use client";

import React, { useState, useTransition } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, StatCard, Btn, PageHeader, Chip, T } from "@/components/admin/ui-pro";
import type { DiscountCode } from "../actions";
import { createDiscountCodeAction, toggleDiscountCodeAction, deleteDiscountCodeAction } from "../actions";

interface Props {
    initialCodes: DiscountCode[];
}

const fmtKES = (n: number) => `KES ${Number(n).toLocaleString()}`;

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (code: DiscountCode) => void }) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        code: "",
        type: "percentage" as "percentage" | "fixed",
        value: "",
        description: "",
        usage_limit: "",
        minimum_order_amount: "",
        ends_at: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.value) { toast.error("Code and value are required"); return; }
        startTransition(async () => {
            try {
                await createDiscountCodeAction({
                    code: form.code,
                    type: form.type,
                    value: Number(form.value),
                    description: form.description || undefined,
                    usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
                    minimum_order_amount: form.minimum_order_amount ? Number(form.minimum_order_amount) : undefined,
                    ends_at: form.ends_at || undefined,
                });
                toast.success(`Discount code "${form.code.toUpperCase()}" created`);
                onClose();
            } catch (err: any) {
                toast.error(err.message || "Failed to create code");
            }
        });
    };

    const fieldClass = "w-full h-10 px-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-5">Create Discount Code</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Code *</label>
                        <input className={fieldClass} placeholder="e.g. LAUNCH20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Type *</label>
                            <select className={fieldClass} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "percentage" | "fixed" }))}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed (KES)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Value *</label>
                            <input className={fieldClass} type="number" min="1" placeholder={form.type === "percentage" ? "20" : "500"} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</label>
                        <input className={fieldClass} placeholder="Launch promo for new customers" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Usage Limit</label>
                            <input className={fieldClass} type="number" placeholder="Unlimited" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Min. Order (KES)</label>
                            <input className={fieldClass} type="number" placeholder="0" value={form.minimum_order_amount} onChange={e => setForm(f => ({ ...f, minimum_order_amount: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Expires</label>
                        <input className={fieldClass} type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="button" variant="ghost" small onClick={onClose} className="flex-1">Cancel</Btn>
                        <Btn type="submit" small disabled={isPending} className="flex-1 bg-primary text-white">
                            {isPending ? "Creating..." : "Create Code"}
                        </Btn>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function PromotionsClient({ initialCodes }: Props) {
    const [codes, setCodes] = useState(initialCodes);
    const [showCreate, setShowCreate] = useState(false);
    const [isPending, startTransition] = useTransition();

    const active = codes.filter(c => c.is_active && (!c.ends_at || new Date(c.ends_at) > new Date())).length;
    const expired = codes.filter(c => !c.is_active || (c.ends_at && new Date(c.ends_at) < new Date())).length;
    const totalUses = codes.reduce((s, c) => s + (c.usage_count || 0), 0);

    const handleToggle = (id: string, current: boolean) => {
        startTransition(async () => {
            try {
                await toggleDiscountCodeAction(id, !current);
                setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    const handleDelete = (id: string, code: string) => {
        if (!confirm(`Delete code "${code}"?`)) return;
        startTransition(async () => {
            try {
                await deleteDiscountCodeAction(id);
                setCodes(prev => prev.filter(c => c.id !== id));
                toast.success("Code deleted");
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(code) => { setCodes(prev => [code, ...prev]); setShowCreate(false); }}
                />
            )}

            <PageHeader title="Discount Codes" sub="Promo codes for checkout">
                <Btn small onClick={() => setShowCreate(true)} className="gap-2 bg-primary text-white">
                    <Plus size={13} /> New Code
                </Btn>
            </PageHeader>

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Active Codes" value={String(active)} color={T.green} icon={Tag} sub="Currently live" />
                <StatCard label="Expired" value={String(expired)} color={T.orange} iconChar="⏱" sub="Inactive or expired" />
                <StatCard label="Total Uses" value={String(totalUses)} color={T.cyan} iconChar="◆" sub="All time redemptions" />
            </div>

            <Card className="overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_80px] px-6 py-3 border-b border-border/30 bg-muted/20">
                    {["Code", "Type", "Value", "Uses", "Min. Order", "Expires", ""].map(h => (
                        <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                    ))}
                </div>

                {codes.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center gap-3">
                        <Tag size={28} className="text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">No discount codes yet.</p>
                        <Btn small onClick={() => setShowCreate(true)} className="gap-2 bg-primary text-white mt-1">
                            <Plus size={12} /> Create your first code
                        </Btn>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {codes.map(c => {
                            const isExpired = !c.is_active || (!!c.ends_at && new Date(c.ends_at) < new Date());
                            const usagePct = c.usage_limit ? Math.round((c.usage_count / c.usage_limit) * 100) : null;
                            return (
                                <motion.div
                                    key={c.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="group grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_80px] px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors items-center"
                                >
                                    <div className="font-mono font-black text-sm text-primary">{c.code}</div>
                                    <div className="text-xs capitalize text-muted-foreground">{c.type}</div>
                                    <div className="font-mono font-bold text-sm">
                                        {c.type === "percentage" ? `${c.value}%` : fmtKES(c.value)}
                                    </div>
                                    <div className="text-xs">
                                        {c.usage_count} {c.usage_limit ? `/ ${c.usage_limit}` : ""}
                                        {usagePct !== null && (
                                            <div className="mt-1 h-1 w-16 bg-muted/40 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(usagePct, 100)}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {c.minimum_order_amount > 0 ? fmtKES(c.minimum_order_amount) : "—"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "2-digit" }) : "Never"}
                                    </div>
                                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleToggle(c.id, c.is_active)}
                                            disabled={isPending}
                                            title={c.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {c.is_active
                                                ? <ToggleRight size={18} className="text-green-400" />
                                                : <ToggleLeft size={18} className="text-muted-foreground/40" />
                                            }
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id, c.code)}
                                            disabled={isPending}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} className="text-red-400/70 hover:text-red-400" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </Card>
        </div>
    );
}
