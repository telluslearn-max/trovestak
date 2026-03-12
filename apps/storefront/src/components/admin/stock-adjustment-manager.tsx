"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Package,
    Plus,
    Minus,
    RotateCcw,
    History,
    Check,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle
} from "lucide-react";
import { getProductVariantsAction, updateStockAction } from "@/app/admin/products/inventory-actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StockAdjustmentManagerProps {
    productId: string;
    productName: string;
    trigger: React.ReactNode;
}

export function StockAdjustmentManager({ productId, productName, trigger }: StockAdjustmentManagerProps) {
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, number>>({});
    const [adjustmentReason, setAdjustmentReason] = useState("restock");

    const fetchVariants = async () => {
        setLoading(true);
        const result = await getProductVariantsAction(productId);
        if (result.success) {
            setVariants(result.variants || []);
            // Initialize adjustments to 0
            const initial: Record<string, number> = {};
            result.variants?.forEach((v: any) => initial[v.id] = 0);
            setAdjustmentAmounts(initial);
        }
        setLoading(false);
    };

    const handleUpdate = async (variantId: string) => {
        const amount = adjustmentAmounts[variantId];
        if (amount === 0) return;

        setUpdatingId(variantId);
        const result = await updateStockAction(variantId, amount, adjustmentReason);
        if (result.success) {
            setVariants(prev => prev.map(v => v.id === variantId ? { ...v, stock_quantity: result.newStock } : v));
            setAdjustmentAmounts(prev => ({ ...prev, [variantId]: 0 }));
        }
        setUpdatingId(null);
    };

    return (
        <Dialog onOpenChange={(open) => open && fetchVariants()}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl rounded-[2.5rem] bg-background/80 backdrop-blur-2xl border-white/20 shadow-2xl p-10 gap-8">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-2xl font-black tracking-tight">{productName}</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inventory Control Center</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Fetching Variant Matrix...</span>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {variants.map((v) => (
                                <div key={v.id} className="group relative bg-muted/20 border border-border/30 rounded-3xl p-6 transition-all hover:bg-muted/30 hover:border-primary/20">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-foreground">{v.name}</h4>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase border-muted/50 text-muted-foreground">{v.sku}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                {v.options?.storage && <span>{v.options.storage}</span>}
                                                {v.options?.color && <span>• {v.options.color}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Current</p>
                                                <div className={cn(
                                                    "text-2xl font-black",
                                                    v.stock_quantity <= 5 ? "text-rose-500" : "text-foreground"
                                                )}>
                                                    {v.stock_quantity}
                                                </div>
                                            </div>

                                            <div className="h-10 w-px bg-border/50 hidden md:block" />

                                            <div className="flex items-center gap-3 bg-background/50 p-2 rounded-2xl border border-white/10 shadow-inner">
                                                <button
                                                    onClick={() => setAdjustmentAmounts(prev => ({ ...prev, [v.id]: (prev[v.id] || 0) - 1 }))}
                                                    className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <div className="w-12 text-center font-black text-lg">
                                                    {(adjustmentAmounts[v.id] || 0) > 0 ? `+${adjustmentAmounts[v.id]}` : adjustmentAmounts[v.id] || 0}
                                                </div>
                                                <button
                                                    onClick={() => setAdjustmentAmounts(prev => ({ ...prev, [v.id]: (prev[v.id] || 0) + 1 }))}
                                                    className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <Button
                                                disabled={updatingId === v.id || (adjustmentAmounts[v.id] || 0) === 0}
                                                onClick={() => handleUpdate(v.id)}
                                                className="h-14 px-8 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl active:scale-95 transition-all"
                                            >
                                                {updatingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                Commit
                                            </Button>
                                        </div>
                                    </div>

                                    {/* History Indicator */}
                                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <Badge className="bg-primary text-white border-none text-[8px] font-black p-1.5 rounded-full shadow-lg cursor-pointer" title="View History">
                                            <History className="h-3 w-3" />
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pr-2">Adjustment Logic:</Label>
                        {['restock', 'sale', 'returns', 'adjustment'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setAdjustmentReason(r)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    adjustmentReason === r ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
