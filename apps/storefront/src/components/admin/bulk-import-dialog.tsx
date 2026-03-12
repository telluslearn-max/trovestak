"use client";

import { useState, useRef } from "react";
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
import { bulkUpsertProducts } from "@/app/admin/products/actions";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Check, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkImportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Define the fields we support for import
const SUPPORTED_FIELDS = [
    { key: "name", label: "Product Name", required: true },
    { key: "slug", label: "Slug (URL)", required: false },
    { key: "description", label: "Description", required: false },
    { key: "price_kes", label: "Base Price (KES)", required: false },
    { key: "category_id", label: "Category ID", required: false },
    { key: "thumbnail_url", label: "Image URL", required: false },
];

export function BulkImportDialog({ open, onClose, onSuccess }: BulkImportDialogProps) {
    const [step, setStep] = useState<"upload" | "map" | "preview" | "importing">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<any[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
            if (lines.length < 2) {
                toast.error("CSV must contain at least a header row and one data row");
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => {
                const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((h, i) => {
                    row[h] = values[i] || "";
                });
                return row;
            });

            setFile(file);
            setCsvHeaders(headers);
            setCsvRows(rows);

            // Auto-mapping logic
            const initialMappings: Record<string, string> = {};
            SUPPORTED_FIELDS.forEach(field => {
                const match = headers.find(h =>
                    h.toLowerCase() === field.key.toLowerCase() ||
                    h.toLowerCase() === field.label.toLowerCase()
                );
                if (match) initialMappings[field.key] = match;
            });
            setMappings(initialMappings);
            setStep("map");
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        // Validate required fields
        const missingRequired = SUPPORTED_FIELDS.filter(f => f.required && !mappings[f.key]);
        if (missingRequired.length > 0) {
            toast.error(`Please map required fields: ${missingRequired.map(f => f.label).join(", ")}`);
            return;
        }

        setStep("importing");
        setLoading(true);

        try {
            const productsToUpsert = csvRows.map(row => {
                const product: any = {};
                Object.entries(mappings).forEach(([fieldKey, csvHeader]) => {
                    let val = row[csvHeader];
                    if (fieldKey === "price_kes") {
                        // Prices in DB are bigint cents
                        const numeric = parseFloat(val);
                        product[fieldKey] = !isNaN(numeric) ? Math.round(numeric * 100) : null;
                    } else {
                        product[fieldKey] = val;
                    }
                });
                return product;
            });

            const result = await bulkUpsertProducts(productsToUpsert);
            toast.success(`Successfully imported ${result.count} products`);
            onSuccess();
            onClose();
        } catch (err: any) {
            setStep("map");
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep("upload");
        setFile(null);
        setCsvHeaders([]);
        setCsvRows([]);
        setMappings({});
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) reset(); onClose(); }}>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-border/50 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Bulk Node Import</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium">
                        Synchronize your local inventory matrix with the Trovestak cloud.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === "upload" && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-video rounded-3xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-foreground uppercase tracking-widest">Drop CSV feed here</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1 tracking-wider uppercase">or click to browse local storage</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {step === "map" && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-widest">
                                    Logic: We matching existing SKU/Name to update, or create new nodes if no match is found.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {SUPPORTED_FIELDS.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-border/30">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                                                    {field.label}
                                                </span>
                                                {field.required && <Badge className="bg-red-500 text-white border-none text-[8px] px-1.5 h-4">Required</Badge>}
                                            </div>
                                            <p className="text-[9px] font-bold text-muted-foreground mt-0.5">DB Field: products.{field.key}</p>
                                        </div>
                                        <div className="w-[240px]">
                                            <Select
                                                value={mappings[field.key] || "__ignore__"}
                                                onValueChange={(val) => setMappings(prev => ({ ...prev, [field.key]: val === "__ignore__" ? "" : val }))}
                                            >
                                                <SelectTrigger className="h-10 bg-card border-border/30 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                                                    <SelectValue placeholder="Ignore field" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="__ignore__" className="text-[10px] font-bold">-- Do Not Import --</SelectItem>
                                                    {csvHeaders.map((header) => (
                                                        <SelectItem key={header} value={header} className="text-[10px] font-bold">
                                                            {header}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "importing" && (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="h-20 w-20 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-foreground uppercase tracking-widest animate-pulse">Synchronizing Data Matrix...</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-2 tracking-widest">{csvRows.length} Nodes detected</p>
                            </div>
                        </div>
                    )}
                </div>

                {step === "map" && (
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="ghost"
                            onClick={reset}
                            className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Start Over
                        </Button>
                        <div className="flex-1" />
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-12 px-8 rounded-2xl border-border/50 text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={loading || !mappings.name}
                            className="h-12 px-10 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 group hover:scale-105 active:scale-95 transition-all"
                        >
                            Finalize Import <Check className="h-4 w-4 ml-2 group-hover:translate-x-1" />
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", className)}>
            {children}
        </span>
    );
}
