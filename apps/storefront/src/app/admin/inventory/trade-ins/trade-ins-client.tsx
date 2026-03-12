"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldCheck, ClipboardCheck, Tag, MoreVertical, Trash2 } from "lucide-react";
import {
    PageHeader, Card, StatCard, Btn, Chip, T, Av, SInput, TH, TD
} from "@/components/admin/ui-pro";
import { toast } from "sonner";
import { createTradeInAction, deleteTradeInAction } from "./actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Customer {
    id: string;
    full_name: string | null;
    email: string | null;
}

interface TradeIn {
    id: string;
    product_name: string;
    customer_id: string;
    condition_grade: string;
    valuation_kes: number;
    status: string;
    notes: string | null;
    created_at: string;
    customer: {
        full_name: string | null;
        email: string | null;
    } | null;
}

interface TradeInsClientProps {
    initialTradeIns: TradeIn[];
    customers: Customer[];
}

export default function TradeInsClient({ initialTradeIns, customers }: TradeInsClientProps) {
    const [tradeIns, setTradeIns] = useState(initialTradeIns);
    const [search, setSearch] = useState("");
    const [isIntakeOpen, setIsIntakeOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [newIntake, setNewIntake] = useState({
        product_name: "",
        customer_id: "",
        condition_grade: "B",
        valuation_kes: 0,
        status: "pending",
        notes: ""
    });

    const handleCreateIntake = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsActionLoading(true);
        try {
            const result = await createTradeInAction(newIntake);
            if (result.success) {
                toast.success("Intake session recorded");
                setIsIntakeOpen(false);
                window.location.reload();
            } else throw new Error(result.error);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this entry?")) return;
        try {
            const result = await deleteTradeInAction(id);
            if (result.success) {
                toast.success("Record purged");
                setTradeIns(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            toast.error("Purge failed");
        }
    };

    const filtered = tradeIns.filter(t =>
        (t.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.customer?.full_name || "").toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: "Pending Tech", value: tradeIns.filter(t => t.status === 'pending').length, icon: ClipboardCheck, color: T.orange },
        { label: "Passed QC", value: tradeIns.filter(t => t.status === 'inspected').length, icon: ShieldCheck, color: T.blue },
        { label: "Converted", value: tradeIns.filter(t => t.status === 'accepted').length, icon: Tag, color: T.green },
    ];

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1600, margin: "0 auto" }}>
            <PageHeader title="Trade-in Intake" sub="Reverse supply chain management and valuations">
                <Btn onClick={() => setIsIntakeOpen(true)}><Plus size={16} style={{ marginRight: 8 }} /> New Session</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {stats.map(s => (
                    <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
                ))}
            </div>

            <div style={{ marginBottom: 20, display: "flex", gap: 12 }}>
                <div style={{ width: 320 }}>
                    <SInput value={search} onChange={setSearch} placeholder="Search devices or customers..." icon={<Search size={14} />} />
                </div>
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 0.8fr" }}>
                    {["Device Details", "Customer Source", "Grade / Value", "Status", "Action"].map(h => <TH key={h}>{h}</TH>)}
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: 80, textAlign: "center", color: T.textMuted }}>
                            No active intake sessions found.
                        </div>
                    ) : (
                        filtered.map((t, i) => [
                            <TD key={`dv${i}`}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t.product_name}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>UID: {t.id.substring(0, 8)}</div>
                                </div>
                            </TD>,
                            <TD key={`cu${i}`}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Av l={t.customer?.full_name?.[0] || "?"} size={28} />
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{t.customer?.full_name || "Guest"}</div>
                                        <div style={{ fontSize: 10, color: T.textSub }}>{t.customer?.email}</div>
                                    </div>
                                </div>
                            </TD>,
                            <TD key={`va${i}`}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Chip s={t.condition_grade === 'A' ? 'delivered' : t.condition_grade === 'B' ? 'processing' : 'draft'} label={`Grade ${t.condition_grade}`} />
                                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>KES {Number(t.valuation_kes).toLocaleString()}</div>
                                </div>
                            </TD>,
                            <TD key={`st${i}`}><Chip s={t.status} /></TD>,
                            <TD key={`ac${i}`}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn small variant="ghost" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Btn>
                                    <Btn small variant="ghost"><MoreVertical size={14} /></Btn>
                                </div>
                            </TD>,
                        ])
                    )}
                </div>
            </Card>

            <Dialog open={isIntakeOpen} onOpenChange={setIsIntakeOpen}>
                <DialogContent style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
                    <DialogHeader>
                        <DialogTitle>Start Intake Session</DialogTitle>
                        <DialogDescription style={{ color: T.textSub }}>Start a reverse procurement session for a device.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateIntake} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                        <div style={{ display: "grid", gap: 8 }}>
                            <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.textSub }}>Device Model</label>
                            <SInput
                                required
                                placeholder="iPhone 15 Pro Max..."
                                value={newIntake.product_name}
                                onChange={(v: string) => setNewIntake({ ...newIntake, product_name: v })}
                            />
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                            <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.textSub }}>Source Account</label>
                            <select
                                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text, fontSize: 12 }}
                                value={newIntake.customer_id}
                                onChange={e => setNewIntake({ ...newIntake, customer_id: e.target.value })}
                            >
                                <option value="">Select Customer...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ display: "grid", gap: 8 }}>
                                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.textSub }}>Grade</label>
                                <select
                                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text, fontSize: 12 }}
                                    value={newIntake.condition_grade}
                                    onChange={e => setNewIntake({ ...newIntake, condition_grade: e.target.value })}
                                >
                                    <option value="A">Grade A</option>
                                    <option value="B">Grade B</option>
                                    <option value="C">Grade C</option>
                                </select>
                            </div>
                            <div style={{ display: "grid", gap: 8 }}>
                                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.textSub }}>Valuation (KES)</label>
                                <SInput
                                    type="number"
                                    value={newIntake.valuation_kes}
                                    onChange={(v: string) => setNewIntake({ ...newIntake, valuation_kes: parseInt(v) || 0 })}
                                />
                            </div>
                        </div>
                        <DialogFooter style={{ marginTop: 20 }}>
                            <Btn variant="ghost" onClick={() => setIsIntakeOpen(false)}>Cancel</Btn>
                            <Btn type="submit" disabled={isActionLoading}>{isActionLoading ? "Recording..." : "Record Intake"}</Btn>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
