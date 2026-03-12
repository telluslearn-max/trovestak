"use client";

import { useState } from "react";
import {
    Smartphone,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    Cpu,
    Wifi,
    Zap,
    Info,
    Settings,
    Bell,
    ExternalLink,
    HelpCircle,
    Activity,
    Server,
    Waves
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DevicesClientProps {
    initialDevices: any[];
}

export default function DevicesClient({ initialDevices }: DevicesClientProps) {
    const [devices] = useState(initialDevices);
    const [selectedDevice, setSelectedDevice] = useState<any>(initialDevices[0] || null);

    return (
        <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-background selection:bg-primary/20">
            <div className="max-w-7xl mx-auto">
                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <Link href="/account" className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Identity Hub
                    </Link>
                </motion.div>

                {/* Header */}
                <header className="mb-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                <Smartphone className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Mesh Management</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-4">
                                My <span className="text-muted-foreground/40 italic font-serif">Devices.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl">
                                Real-time status and technical matrix for your active mesh equipment.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-muted/30 border border-apple-border dark:border-apple-border-dark rounded-3xl p-6 flex items-center gap-8"
                        >
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Nodes</p>
                                <p className="text-3xl font-black text-foreground">{devices.length}</p>
                            </div>
                            <div className="w-px h-10 bg-apple-border dark:bg-apple-border-dark" />
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Health Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <p className="text-lg font-black text-foreground uppercase tracking-tighter">OPTIMAL</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </header>

                {devices.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Device List Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 mb-6">Connected Equipment</p>
                            <AnimatePresence mode="popLayout">
                                {devices.map((device, idx) => (
                                    <motion.button
                                        key={device.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setSelectedDevice(device)}
                                        className={cn(
                                            "w-full text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden group",
                                            selectedDevice?.id === device.id
                                                ? "bg-foreground text-background border-foreground shadow-2xl"
                                                : "glass-card border-apple-border dark:border-apple-border-dark hover:border-primary/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                                                selectedDevice?.id === device.id ? "bg-background/10" : "bg-muted/40"
                                            )}>
                                                <Smartphone className={cn(
                                                    "w-7 h-7",
                                                    selectedDevice?.id === device.id ? "text-background" : "text-muted-foreground/60"
                                                )} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-[13px] font-black uppercase tracking-widest truncate">
                                                        {device.products?.name}
                                                    </h3>
                                                    {selectedDevice?.id === device.id && (
                                                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-[10px] font-medium uppercase tracking-tight",
                                                    selectedDevice?.id === device.id ? "opacity-60" : "text-muted-foreground"
                                                )}>
                                                    S/N: {device.serial_number || "NOT_ASSIGNED"}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>

                            <button className="w-full mt-6 py-6 border-2 border-dashed border-apple-border dark:border-apple-border-dark rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex flex-col items-center gap-3 group">
                                <div className="p-3 bg-muted/20 rounded-full group-hover:bg-primary/10 transition-colors">
                                    <Zap className="w-4 h-4" />
                                </div>
                                Register New Node
                            </button>
                        </div>

                        {/* Device Details Viewer */}
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                {selectedDevice && (
                                    <motion.div
                                        key={selectedDevice.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        className="glass-card rounded-[3rem] border border-apple-border dark:border-apple-border-dark overflow-hidden"
                                    >
                                        {/* Status Banner */}
                                        <div className="bg-foreground text-background p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex items-center gap-8">
                                                <div className="w-24 h-24 md:w-32 md:h-32 bg-background/5 rounded-[2.5rem] flex items-center justify-center backdrop-blur-3xl border border-background/10">
                                                    {selectedDevice.products?.thumbnail_url ? (
                                                        <img
                                                            src={selectedDevice.products.thumbnail_url}
                                                            alt={selectedDevice.products.name}
                                                            className="w-full h-full object-cover rounded-[2.5rem] grayscale brightness-200"
                                                        />
                                                    ) : (
                                                        <Smartphone className="w-12 h-12 text-background/40" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">ACTIVE ON MESH</span>
                                                    </div>
                                                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                                                        {selectedDevice.products?.name}
                                                    </h2>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
                                                        IDENTIFIER: {selectedDevice.id.slice(0, 12).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end gap-6 border-t md:border-t-0 md:border-l border-background/10 pt-6 md:pt-0 md:pl-10">
                                                <div className="flex-1 md:flex-none text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Uptime</p>
                                                    <p className="text-xl font-black tracking-tight">99.9%</p>
                                                </div>
                                                <div className="flex-1 md:flex-none text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Signal Strength</p>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <div key={s} className={cn(
                                                                "w-1 h-3 rounded-full",
                                                                s <= 4 ? "bg-emerald-400" : "bg-background/20"
                                                            )} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-10 md:p-14 space-y-12">
                                            {/* Technical Matrix */}
                                            <section>
                                                <div className="flex items-center gap-3 mb-8">
                                                    <Cpu className="w-4 h-4 text-primary" />
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Technical Matrix</h4>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <SpecCard label="COMPUTE CLASS" value={selectedDevice.products?.product_mesh_node?.[0]?.compute_class?.toUpperCase() || "STANDARD"} />
                                                    <SpecCard label="NODE ROLE" value={selectedDevice.products?.product_mesh_node?.[0]?.is_master ? "MASTER" : "SUBSIDIARY"} />
                                                    <SpecCard label="VARIANT" value={selectedDevice.product_variants?.name || "BASE"} />
                                                    <SpecCard label="ACQUIRED" value={selectedDevice.acquired_at ? new Date(selectedDevice.acquired_at).toLocaleDateString("en-KE") : "N/A"} />
                                                </div>
                                            </section>

                                            {/* Specifications Detail */}
                                            {selectedDevice.products?.content_specifications && (
                                                <section>
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <Info className="w-4 h-4 text-primary" />
                                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Material Specifications</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                        {Object.entries(selectedDevice.products.content_specifications).slice(0, 6).map(([key, value]: [string, any]) => (
                                                            <div key={key} className="flex items-center justify-between border-b border-apple-border dark:border-apple-border-dark pb-4">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                                                                <span className="text-[11px] font-bold text-foreground">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Action Control Panel */}
                                            <div className="pt-8 border-t border-apple-border dark:border-apple-border-dark flex flex-wrap gap-4">
                                                <button className="flex items-center gap-3 px-8 py-4 bg-muted/40 hover:bg-muted/60 text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] border border-apple-border dark:border-apple-border-dark transition-all group">
                                                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                                                    Node Configuration
                                                </button>
                                                <button className="flex items-center gap-3 px-8 py-4 bg-muted/40 hover:bg-muted/60 text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] border border-apple-border dark:border-apple-border-dark transition-all">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                    Warranty Status
                                                </button>
                                                <button className="flex items-center gap-3 px-8 py-4 bg-primary/5 hover:bg-primary/10 text-primary rounded-2xl font-black uppercase tracking-widest text-[10px] border border-primary/20 transition-all ml-auto">
                                                    <HelpCircle className="w-4 h-4" />
                                                    Support Ticket
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-40 glass-card rounded-[3rem] border border-dashed border-apple-border dark:border-apple-border-dark flex flex-col items-center"
                    >
                        <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center text-muted-foreground/20 mb-8">
                            <Smartphone className="w-12 h-12" strokeWidth={1} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-foreground mb-4 uppercase">No Nodes Found</h2>
                        <p className="text-muted-foreground font-medium mb-12 max-w-sm mx-auto leading-relaxed px-6">
                            You currently have no registered equipment. Acquire new mesh nodes or register existing devices manually to begin management.
                        </p>
                        <Link
                            href="/store"
                            className="inline-flex items-center gap-3 px-12 py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-foreground/20"
                        >
                            <Zap className="w-4 h-4" />
                            Explore the Mesh
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function SpecCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-6 rounded-2xl bg-muted/30 border border-apple-border dark:border-apple-border-dark group hover:border-primary/20 transition-all">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-2 group-hover:text-primary transition-colors">{label}</p>
            <p className="text-[13px] font-black text-foreground tracking-tight truncate">{value}</p>
        </div>
    );
}
