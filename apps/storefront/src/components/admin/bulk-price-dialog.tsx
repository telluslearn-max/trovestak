"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { bulkUpdatePrices } from "@/app/admin/products/actions";
import { toast } from "sonner";
import { TrendingUp, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkPriceDialogProps {
    open: boolean;
    onClose: () => void;
    selectedIds: string[];
    onSuccess: () => void;
}

export function BulkPriceDialog({ open, onClose, selectedIds, onSuccess }: BulkPriceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<"percentage" | "fixed">("percentage");
    const [direction, setDirection] = useState<"increase" | "decrease">("increase");
    const [value, setValue] = useState<string>("");

    const handleApply = async () => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            await bulkUpdatePrices(selectedIds, type, numValue, direction);
            toast.success(`Updated prices for variants of ${selectedIds.length} products`);
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-border/50 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-4">
                        <TrendingUp className="h-6 w-6 text-accent-purple" />
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Market Price Adjustment</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium">
                        Adjust pricing for {selectedIds.length} selected product nodes.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDirection("increase")}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all",
                                direction === "increase"
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm"
                                    : "bg-muted/20 text-muted-foreground/40 border border-transparent opacity-50 hover:opacity-100"
                            )}
                        >
                            <ArrowUp className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mark Up</span>
                        </button>
                        <button
                            onClick={() => setDirection("decrease")}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all",
                                direction === "decrease"
                                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm"
                                    : "bg-muted/20 text-muted-foreground/40 border border-transparent opacity-50 hover:opacity-100"
                            )}
                        >
                            <ArrowDown className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mark Down</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 ml-1">Logic</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger className="h-14 bg-muted/30 border-none rounded-2xl px-6 focus:ring-primary/20 text-sm font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/50">
                                    <SelectItem value="percentage" className="rounded-xl font-bold">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed" className="rounded-xl font-bold">Fixed (KES)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 ml-1">
                                {type === "percentage" ? "Rate (%)" : "Amount (KES)"}
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="0"
                                    className="h-14 bg-muted/30 border-none rounded-2xl px-6 focus-visible:ring-primary/20 text-sm font-bold pr-12"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                    {type === "percentage" ? "%" : "KES"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl border-border/50 text-[10px] font-black uppercase tracking-widest"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={loading || !value}
                        className="flex-1 h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Initiate Update"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
