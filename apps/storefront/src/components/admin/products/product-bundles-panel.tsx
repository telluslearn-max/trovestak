"use client";

import React, { useState, useEffect } from "react";
import { Layers, ChevronRight, Package, Grid, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBundlesForProduct } from "@/app/admin/bundles/actions";
import Link from "next/link";

interface ProductBundlesPanelProps {
    productId: string;
    isDark?: boolean;
}

export function ProductBundlesPanel({ productId, isDark }: ProductBundlesPanelProps) {
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getBundlesForProduct(productId);
                setBundles(data);
            } catch (e) {
                console.error("Failed to load product bundles", e);
            } finally {
                setLoading(true); // Wait, should be false
                setLoading(false);
            }
        }
        if (productId) load();
    }, [productId]);

    if (loading) {
        return (
            <div className="h-24 w-full bg-muted/20 animate-pulse rounded-3xl border border-dashed border-border" />
        );
    }

    if (bundles.length === 0) {
        return (
            <div className={cn(
                "p-6 lg:p-8 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center transition-all",
                isDark ? "bg-[#1e293b]/10 border-[#1f2937]" : "bg-slate-50 border-slate-200"
            )}>
                <div className="h-10 w-10 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                    <AlertCircle size={18} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground tracking-tight">Isolated Product</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[200px]">Existing outside of curated bundles.</p>
                <Link
                    href="/admin/bundles"
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 mt-6 hover:text-violet-400 transition-colors"
                >
                    Edit Architecture →
                </Link>
            </div>
        );
    }

    return (
        <div className={cn(
            "p-6 lg:p-8 rounded-[2.5rem] border transition-all apple-shadow",
            isDark ? "bg-[#1e293b]/30 border-[#1f2937]" : "bg-slate-50 border-slate-100"
        )}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold flex items-center gap-3 text-white">
                        <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Layers size={14} className="text-violet-500" />
                        </div>
                        Curated Bundles
                    </h3>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.15em] mt-2 ml-11">{bundles.length} high-value grouping(s)</p>
                </div>
            </div>

            <div className="space-y-4">
                {bundles.map(bundle => (
                    <Link
                        key={bundle.id}
                        href={`/admin/bundles?edit=${bundle.id}`}
                        className={cn(
                            "flex items-center justify-between p-5 rounded-[1.5rem] border bg-[#0F172A]/40 hover:bg-[#0F172A] hover:border-violet-500/50 transition-all group",
                            isDark ? "border-slate-800/50" : "border-slate-200"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg",
                                bundle.bundle_type === "fixed" ? "bg-blue-500/10 text-blue-400 shadow-blue-500/5" : "bg-fuchsia-500/10 text-fuchsia-400 shadow-fuchsia-500/5"
                            )}>
                                {bundle.bundle_type === "fixed" ? <Package size={18} /> : <Grid size={18} />}
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-slate-200 group-hover:text-white transition-colors">{bundle.name}</div>
                                <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                                    {bundle.bundle_type} Architecture
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-violet-500 transition-all group-hover:translate-x-1" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
