"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/admin/theme-wrapper";
import {
    Factory,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Star,
    TrendingUp,
    Clock,
    ArrowUpRight,
    MapPin,
    Phone,
    Mail,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteSupplierAction, purgeSuppliersAction, createSupplierAction } from "./actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Supplier {
    id: string;
    name: string;
    display_name: string | null;
    email: string | null;
    phone_primary: string | null;
    location: string | null;
    business_type: string | null;
    reliability_score: number;
    total_spend_kes: number;
    total_orders: number;
    notes: string | null;
}

interface SuppliersClientProps {
    initialSuppliers: Supplier[];
}

export default function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [animIn, setAnimIn] = useState(false);

    // New Partner State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPartner, setNewPartner] = useState({
        name: "",
        display_name: "",
        email: "",
        phone_primary: "",
        location: "",
        business_type: "individual",
        notes: ""
    });

    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        setTimeout(() => setAnimIn(true), 100);
    }, []);

    const handleDeleteSupplier = async (id: string) => {
        setIsActionLoading(true);
        try {
            const result = await deleteSupplierAction(id);
            if (result.success) {
                toast.success("Supplier removed from directory");
                setConfirmDeleteId(null);
                setSuppliers(prev => prev.filter(s => s.id !== id));
            } else {
                toast.error(`Deletion failed: ${result.error}`);
            }
        } catch (err: any) {
            toast.error("Action failed");
            console.error(err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteAllSuppliers = async () => {
        setIsActionLoading(true);
        try {
            const result = await purgeSuppliersAction();
            if (result.success) {
                toast.success("Directory purged successfully");
                setIsDeletingAll(false);
                setSuppliers([]);
            } else {
                toast.error(`Purge failed: ${result.error}`);
            }
        } catch (err: any) {
            toast.error("Bulk action failed");
            console.error(err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPartner.name) {
            toast.error("Supplier name is required");
            return;
        }

        setIsActionLoading(true);
        try {
            const result = await createSupplierAction(newPartner);
            if (result.success) {
                toast.success(`${newPartner.name} added to directory`);
                setIsCreateOpen(false);
                setNewPartner({
                    name: "",
                    display_name: "",
                    email: "",
                    phone_primary: "",
                    location: "",
                    business_type: "individual",
                    notes: ""
                });
                window.location.reload(); // Simple refresh for now to get the new list with ID
            } else {
                toast.error(`Failed to create: ${result.error}`);
            }
        } catch (err: any) {
            toast.error("Action failed");
            console.error(err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.display_name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-[28px] px-[32px] pb-[48px] max-w-[1400px] mx-auto transition-all duration-700 ease-out font-dm-sans"
            style={{ background: isDark ? "#020617" : "#f8fafc", opacity: animIn ? 1 : 0, transform: animIn ? "none" : "translateY(10px)" }}>

            {/* Create Supplier Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Partner</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Enter the details for your new procurement partner.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSupplier} className="space-y-4 py-4 font-dm-sans">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Internal Name *</label>
                                <input
                                    required
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500/50 transition-all"
                                    placeholder="e.g. ahmed-zack"
                                    value={newPartner.name}
                                    onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Display Name</label>
                                <input
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500/50 transition-all"
                                    placeholder="e.g. Ahmed Zack Electronics"
                                    value={newPartner.display_name}
                                    onChange={e => setNewPartner({ ...newPartner, display_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500/50 transition-all"
                                    placeholder="contact@partner.com"
                                    value={newPartner.email}
                                    onChange={e => setNewPartner({ ...newPartner, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Primary</label>
                                <input
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500/50 transition-all"
                                    placeholder="+254..."
                                    value={newPartner.phone_primary}
                                    onChange={e => setNewPartner({ ...newPartner, phone_primary: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Office Location</label>
                            <input
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500/50 transition-all"
                                placeholder="e.g. Nairobi CBD, Tom Mboya St"
                                value={newPartner.location}
                                onChange={e => setNewPartner({ ...newPartner, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Business Type</label>
                            <select
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500/50 transition-all"
                                value={newPartner.business_type}
                                onChange={e => setNewPartner({ ...newPartner, business_type: e.target.value })}
                            >
                                <option value="individual">Individual</option>
                                <option value="company">Company</option>
                                <option value="distributor">Distributor</option>
                                <option value="importer">Importer</option>
                            </select>
                        </div>
                        <DialogFooter className="pt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="px-6 py-2.5 bg-slate-800 text-slate-400 rounded-full font-bold text-[12px] uppercase tracking-wider hover:text-white transition-all mr-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isActionLoading}
                                className="px-8 py-2.5 bg-white text-black rounded-full font-bold text-[12px] uppercase tracking-wider hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                            >
                                {isActionLoading ? "Saving..." : "Create Partner"}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-3 text-blue-500 font-mono text-[10px] font-black tracking-[0.2em] uppercase">
                        <Factory size={14} />
                        <span>Procurement Flow</span>
                    </div>
                    <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-none mb-3">
                        Supplier <span className="text-slate-500 italic font-medium">Directory</span>
                    </h1>
                    <p className="text-slate-500 text-[13px] max-w-md font-medium leading-relaxed">
                        Manage your global network of procurement partners and track reliability metrics.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {isDeletingAll ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteAllSuppliers}
                                disabled={isActionLoading}
                                className={cn(
                                    "px-6 py-3 bg-red-600 text-white rounded-full font-bold text-[12px] uppercase tracking-wider hover:bg-red-700 transition-all shadow-lg",
                                    isActionLoading ? "opacity-50 cursor-not-allowed" : "animate-pulse"
                                )}
                            >
                                {isActionLoading ? "Purging..." : "Yes, Purge All"}
                            </button>
                            <button
                                onClick={() => setIsDeletingAll(false)}
                                disabled={isActionLoading}
                                className="px-4 py-3 bg-slate-800 text-slate-400 rounded-full font-bold text-[12px] uppercase tracking-wider hover:text-white transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsDeletingAll(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-[12px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        >
                            <Trash2 size={14} strokeWidth={3} />
                            Clear Directory
                        </button>
                    )}
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-[12px] uppercase tracking-wider hover:scale-105 transition-all shadow-xl"
                    >
                        <Plus size={14} strokeWidth={3} />
                        New Partner
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Active Partners", value: suppliers.length, icon: Star, color: "#3b82f6" },
                    { label: "Avg. Reliability", value: "94%", icon: TrendingUp, color: "#22c55e" },
                    { label: "Lead Time (Avg)", value: "3.2 Days", icon: Clock, color: "#f59e0b" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 shadow-sm border border-white/[0.03] rounded-[14px] p-[20px] px-[22px] flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[14px] bg-slate-800/80 flex items-center justify-center text-white" style={{ color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</div>
                            <div className="text-xl font-bold text-foreground font-mono">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-5 bg-slate-900/10 p-2 rounded-[14px] border border-white/[0.03]">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search partners by name, location or email..."
                        className="w-full bg-transparent border-none py-2.5 pl-11 pr-4 text-[13px] font-medium text-foreground focus:ring-0 placeholder:text-slate-700 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors">
                    <Filter size={12} />
                    Filters
                </button>
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSuppliers.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-slate-900/20 rounded-[14px] border border-dashed border-white/[0.05]">
                        <p className="text-slate-600 font-medium text-[13px]">No partners found in directory.</p>
                    </div>
                ) : filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="group bg-slate-900/40 border border-white/[0.03] rounded-[14px] p-7 hover:bg-slate-900/60 transition-all duration-300 relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.03] flex items-center justify-center text-xl font-black text-white uppercase group-hover:scale-105 transition-transform duration-500">
                                    {supplier.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
                                        {supplier.display_name || supplier.name}
                                        {supplier.reliability_score >= 0.9 && (
                                            <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-tighter border border-blue-500/20">Gold Tier</div>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium tracking-tight">
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {supplier.location || "Default Location"}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                        <span className="flex items-center gap-1 uppercase tracking-wider opacity-80">{supplier.business_type || "SUPPLIER"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {confirmDeleteId === supplier.id ? (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDeleteSupplier(supplier.id)}
                                            disabled={isActionLoading}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-[10px] font-black uppercase hover:bg-red-700 transition-all shadow-md disabled:opacity-50"
                                        >
                                            {isActionLoading ? "..." : "Confirm"}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(null)}
                                            disabled={isActionLoading}
                                            className="px-2 py-1.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-black uppercase hover:text-white transition-all disabled:opacity-50"
                                        >
                                            X
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDeleteId(supplier.id)}
                                        className="h-8 w-8 rounded-lg bg-red-500/5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center border border-red-500/10 hover:border-red-500/30"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                <button className="h-8 w-8 rounded-lg bg-slate-800/50 text-slate-500 hover:text-white transition-all flex items-center justify-center">
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-[14px] bg-slate-950/40 border border-white/[0.02]">
                                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5">Total Procurement</div>
                                <div className="text-[15px] font-bold text-blue-400 font-mono">KES {new Intl.NumberFormat().format(supplier.total_spend_kes || 0)}</div>
                            </div>
                            <div className="p-4 rounded-[14px] bg-slate-950/40 border border-white/[0.02]">
                                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5">Active Orders</div>
                                <div className="text-[15px] font-bold text-foreground font-mono">{supplier.total_orders || 0}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer">
                                <Phone size={10} className="text-blue-500/70" /> {supplier.phone_primary || "Contact Unknown"}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer">
                                <Mail size={10} className="text-blue-500/70" /> {supplier.email || "No Email Reachable"}
                            </div>
                            <div className="ml-auto flex items-center gap-1.5 text-blue-500 font-bold group-hover:translate-x-1 transition-transform cursor-pointer text-[10px] uppercase tracking-wider">
                                View Profile <ArrowUpRight size={12} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
