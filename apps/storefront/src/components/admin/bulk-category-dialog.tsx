"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { bulkUpdateCategory } from "@/app/admin/products/actions";
import { toast } from "sonner";
import { Tag, Loader2 } from "lucide-react";

interface BulkCategoryDialogProps {
    open: boolean;
    onClose: () => void;
    selectedIds: string[];
    onSuccess: () => void;
}

export function BulkCategoryDialog({ open, onClose, selectedIds, onSuccess }: BulkCategoryDialogProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setSelectedCategory(undefined);
            const fetchCategories = async () => {
                const { data } = await supabase.from("categories").select("id, name").order("name");
                setCategories(data || []);
            };
            fetchCategories();
        }
    }, [open]);

    const handleApply = async () => {
        if (!selectedCategory) return;
        setLoading(true);
        try {
            await bulkUpdateCategory(selectedIds, selectedCategory);
            toast.success(`Updated category for ${selectedIds.length} products`);
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
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border/50 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Bulk Categorization</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium">
                        Move {selectedIds.length} selected products to a new category.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 ml-1">Target Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-14 bg-muted/30 border-none rounded-2xl px-6 focus:ring-primary/20 text-sm font-bold">
                                <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/50">
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id} className="rounded-xl font-bold">
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl border-border/50 text-[10px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={loading || !selectedCategory}
                        className="flex-1 h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Apply Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
