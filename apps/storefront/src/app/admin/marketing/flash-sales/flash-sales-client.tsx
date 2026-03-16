"use client";

import React, { useState, useTransition } from "react";
import { Plus, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, StatCard, Btn, PageHeader, T } from "@/components/admin/ui-pro";
import type { FlashSale } from "../actions";
import { createFlashSaleAction, toggleFlashSaleAction } from "../actions";

interface Props {
    initialSales: FlashSale[];
}

function CreateModal({ onClose }: { onClose: () => void }) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        title: "",
        description: "",
        discount_percent: "20",
        starts_at: "",
        ends_at: "",
        banner_color: "#ff3b30",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.starts_at || !form.ends_at) { toast.error("Title, start, and end time are required"); return; }
        startTransition(async () => {
            try {
                await createFlashSaleAction({
                    title: form.title,
                    description: form.description || undefined,
                    discount_percent: Number(form.discount_percent),
                    starts_at: new Date(form.starts_at).toISOString(),
                    ends_at: new Date(form.ends_at).toISOString(),
                    banner_color: form.banner_color,
                });
                toast.success("Flash sale created");
                onClose();
            } catch (err: any) {
                toast.error(err.message || "Failed to create flash sale");
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
                <h2 className="text-lg font-bold mb-5">Schedule Flash Sale</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Title *</label>
                        <input className={fieldClass} placeholder='e.g. "Cyber Monday — 30% Off Laptops"' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</label>
                        <input className={fieldClass} placeholder="Optional tagline" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Discount % *</label>
                            <input className={fieldClass} type="number" min="1" max="99" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Banner Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={form.banner_color} onChange={e => setForm(f => ({ ...f, banner_color: e.target.value }))} className="h-10 w-12 rounded-lg border border-border/50 cursor-pointer" />
                                <input className={`${fieldClass} flex-1`} value={form.banner_color} onChange={e => setForm(f => ({ ...f, banner_color: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Starts *</label>
                            <input className={fieldClass} type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Ends *</label>
                            <input className={fieldClass} type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="button" variant="ghost" small onClick={onClose} className="flex-1">Cancel</Btn>
                        <Btn type="submit" small disabled={isPending} className="flex-1 bg-primary text-white">
                            {isPending ? "Creating..." : "Schedule Sale"}
                        </Btn>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function FlashSalesClient({ initialSales }: Props) {
    const [sales, setSales] = useState(initialSales);
    const [showCreate, setShowCreate] = useState(false);
    const [isPending, startTransition] = useTransition();

    const now = new Date();
    const active = sales.filter(s => s.is_active && new Date(s.starts_at) <= now && new Date(s.ends_at) >= now).length;
    const upcoming = sales.filter(s => s.is_active && new Date(s.starts_at) > now).length;
    const ended = sales.filter(s => new Date(s.ends_at) < now).length;

    const handleToggle = (id: string, current: boolean) => {
        startTransition(async () => {
            try {
                await toggleFlashSaleAction(id, !current);
                setSales(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    const getStatus = (s: FlashSale) => {
        if (!s.is_active) return { label: "Disabled", color: "bg-muted/40 text-muted-foreground" };
        const start = new Date(s.starts_at);
        const end = new Date(s.ends_at);
        if (now < start) return { label: "Upcoming", color: "bg-blue-500/10 text-blue-400" };
        if (now > end) return { label: "Ended", color: "bg-muted/40 text-muted-foreground" };
        return { label: "Live", color: "bg-red-500/10 text-red-400" };
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

            <PageHeader title="Flash Sales" sub="Time-limited discount events">
                <Btn small onClick={() => setShowCreate(true)} className="gap-2 bg-primary text-white">
                    <Plus size={13} /> Schedule Sale
                </Btn>
            </PageHeader>

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Live Now" value={String(active)} color={T.red} icon={Zap} sub="Currently running" />
                <StatCard label="Upcoming" value={String(upcoming)} color={T.blue} iconChar="⏰" sub="Scheduled" />
                <StatCard label="Ended" value={String(ended)} color={T.textMuted} iconChar="✓" sub="Completed" />
            </div>

            <Card className="overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] px-6 py-3 border-b border-border/30 bg-muted/20">
                    {["Title", "Discount", "Starts", "Ends", "Status", ""].map(h => (
                        <div key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</div>
                    ))}
                </div>

                {sales.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center gap-3">
                        <Zap size={28} className="text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">No flash sales yet.</p>
                        <Btn small onClick={() => setShowCreate(true)} className="gap-2 bg-primary text-white mt-1">
                            <Plus size={12} /> Schedule your first sale
                        </Btn>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {sales.map(s => {
                            const st = getStatus(s);
                            return (
                                <motion.div
                                    key={s.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors items-center"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ background: s.banner_color || "#ff3b30" }}
                                            />
                                            <span className="text-sm font-bold">{s.title}</span>
                                        </div>
                                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                                    </div>
                                    <div className="font-mono font-black text-lg" style={{ color: s.banner_color || "#ff3b30" }}>
                                        {s.discount_percent}% OFF
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(s.starts_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}
                                        <br />
                                        <span className="text-[10px]">{new Date(s.starts_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(s.ends_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}
                                        <br />
                                        <span className="text-[10px]">{new Date(s.ends_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${st.color}`}>{st.label}</span>
                                    </div>
                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleToggle(s.id, s.is_active)} disabled={isPending} title={s.is_active ? "Disable" : "Enable"}>
                                            {s.is_active
                                                ? <ToggleRight size={18} className="text-green-400" />
                                                : <ToggleLeft size={18} className="text-muted-foreground/40" />
                                            }
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
