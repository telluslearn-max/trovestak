"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, Calendar, Download, UserPlus, Filter, ChevronRight, DollarSign } from "lucide-react";
import { getCustomers } from "../actions";
import {
    PageHeader, Card, StatCard, Btn, Chip, T, Av, SInput, TH, TD
} from "@/components/admin/ui-pro";
import { toast } from "sonner";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const processed = await getCustomers();
            setCustomers(processed);
        } catch (err: any) {
            toast.error(err.message || "Failed to sync customer directory");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const filtered = customers.filter(c =>
        (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (val: number) => `KES ${Number(val).toLocaleString()}`;

    return (
        <div className="page-enter" style={{ padding: "32px", maxWidth: 1600, margin: "0 auto" }}>
            <PageHeader title="Customers" sub={`${customers.length} registered accounts in directory`}>
                <Btn variant="ghost"><Download size={16} style={{ marginRight: 8 }} /> Export</Btn>
                <Btn><UserPlus size={16} style={{ marginRight: 8 }} /> Add Customer</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Customers" value={customers.length} icon={Users} color={T.blue} />
                <StatCard label="Active This Month" value={customers.filter(c => c.order_count > 0).length} icon={Calendar} color={T.green} />
                <StatCard label="Avg. Lifetime Value" value={customers.length ? fmt(customers.reduce((a, b) => a + b.total_spent, 0) / customers.length) : "KES 0"} iconChar="$" color={T.purple} />
            </div>

            <div style={{ marginBottom: 20, display: "flex", gap: 12 }}>
                <div style={{ width: 320 }}>
                    <SInput value={search} onChange={setSearch} placeholder="Search by name, email or ID..." icon={<Search size={14} />} />
                </div>
                <Btn variant="ghost"><Filter size={14} style={{ marginRight: 8 }} /> Segments</Btn>
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 0.8fr 1fr 1fr 0.8fr" }}>
                    {["Customer", "Contact", "Orders", "Spent", "Joined", "Status"].map(h => <TH key={h}>{h}</TH>)}
                    {loading ? (
                        <div style={{ gridColumn: "span 6", padding: 80, textAlign: "center", color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                            SCANNING_ENROLLED_BIOMETRICS...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ gridColumn: "span 6", padding: 80, textAlign: "center", color: T.textMuted }}>
                            No identity matches found in the registry.
                        </div>
                    ) : (
                        filtered.map((c, i) => [
                            <TD key={`cu${i}`}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <Av l={c.full_name?.[0] || "?"} size={36} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.full_name || "Anonymous User"}</div>
                                        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>ID: {c.id.substring(0, 8).toUpperCase()}</div>
                                    </div>
                                </div>
                            </TD>,
                            <TD key={`co${i}`} muted>
                                <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}><Mail size={12} /> {c.email}</div>
                                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{c.phone || "No phone linked"}</div>
                            </TD>,
                            <TD key={`or${i}`} mono>{c.order_count}</TD>,
                            <TD key={`sp${i}`} mono color={T.green} style={{ fontWeight: 700 }}>{fmt(c.total_spent)}</TD>,
                            <TD key={`jo${i}`} muted>{new Date(c.created_at).toLocaleDateString()}</TD>,
                            <TD key={`st${i}`}><Chip s="active" label="ACTIVE" /></TD>,
                        ])
                    )}
                </div>
            </Card>
        </div>
    );
}
