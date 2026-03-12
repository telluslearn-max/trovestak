"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Upload, X, AlertTriangle, CheckSquare } from "lucide-react";
import { supabase as db } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function BulkProductActions({
    selectedIds,
    onClearSelection,
}: {
    selectedIds: string[];
    onClearSelection: () => void;
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleBulkDelete = () => startTransition(async () => {
        await db.from("products").update({ status: "archived" }).in("id", selectedIds);
        router.refresh();
        onClearSelection();
        setDeleteOpen(false);
    });

    const handleExportCSV = () => {
        startTransition(async () => {
            const { data } = await db
                .from("products")
                .select("id, name, slug, price, stock_quantity, status, sku")
                .in("id", selectedIds.length > 0 ? selectedIds : ["00000000-0000-0000-0000-000000000000"])
                .order("created_at", { ascending: false });

            if (!data || data.length === 0) {
                // Export all if nothing selected
                const { data: all } = await db
                    .from("products")
                    .select("id, name, slug, price, stock_quantity, status, sku")
                    .order("created_at", { ascending: false });

                exportToCSV(all ?? []);
            } else {
                exportToCSV(data);
            }
        });
    };

    const exportToCSV = (rows: any[]) => {
        const header = ["ID", "Name", "Slug", "Price (KES)", "Stock", "Status", "SKU"];
        const csv = [
            header.join(","),
            ...rows.map(r =>
                [r.id, `"${r.name}"`, r.slug, r.price / 100, r.stock_quantity ?? 0, r.status, r.sku ?? ""].join(",")
            ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (selectedIds.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-card text-white rounded-2xl px-5 py-3 shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    {selectedIds.length} selected
                </div>
                <div className="w-px h-5 bg-gray-600" />
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                    <Download className="h-4 w-4" /> Export
                </button>
                <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="h-4 w-4" /> Archive
                </button>
                <button onClick={onClearSelection} className="text-gray-500 hover:text-gray-300 transition-colors ml-1">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteOpen(false)} />
                    <div className="relative bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in duration-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Archive {selectedIds.length} product{selectedIds.length > 1 ? "s" : ""}?</h3>
                                <p className="text-sm text-gray-400 mt-1">They will be hidden from the storefront. You can restore them later.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => setDeleteOpen(false)} variant="outline" className="flex-1 h-9 rounded-lg">Cancel</Button>
                            <Button onClick={handleBulkDelete} disabled={isPending} className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white">
                                {isPending ? "Archiving…" : "Archive All"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
