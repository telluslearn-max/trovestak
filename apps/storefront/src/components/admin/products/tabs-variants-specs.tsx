import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, X, AlertTriangle, Layers, ChevronDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SectionHead, FieldGroup, Field } from "./editor-layout";
import { toast } from "sonner";
import { useTheme } from "@/components/admin/theme-wrapper";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface AttrValue { id: string; value: string; hex_color: string | null; sort_order: number; }
interface GlobalAttribute { id: string; name: string; slug: string; display_type: string; attribute_values: AttrValue[]; }
interface Template { id: string; name: string; slug: string; variant_template_attributes: { attribute_id: string }[]; }

interface TabVariantsProps {
    variantTypes: any[];
    setVariantTypes: (types: any[]) => void;
    generatedVariants: any[];
    setGeneratedVariants: (variants: any[]) => void;
    saving?: boolean;
}

export function TabVariants({
    variantTypes,
    setVariantTypes,
    generatedVariants,
    setGeneratedVariants
}: TabVariantsProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
    const [pendingGenerate, setPendingGenerate] = useState<any[]>([]);

    // Global attributes state
    const [globalAttrs, setGlobalAttrs] = useState<GlobalAttribute[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedAttrIds, setSelectedAttrIds] = useState<Set<string>>(new Set());
    const [selectedValueIds, setSelectedValueIds] = useState<Record<string, Set<string>>>({});
    const [showAttrPicker, setShowAttrPicker] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    // Load global attributes and templates
    useEffect(() => {
        (async () => {
            const [{ data: attrs }, { data: tmpls }] = await Promise.all([
                supabase.from("attributes").select("*, attribute_values(id, value, hex_color, sort_order)").order("sort_order"),
                supabase.from("variant_templates").select("*, variant_template_attributes(attribute_id)").order("created_at"),
            ]);
            setGlobalAttrs(attrs || []);
            setTemplates(tmpls || []);
        })();
    }, []);

    // Sync selected attrs from variantTypes (backward compat)
    useEffect(() => {
        if (variantTypes.length > 0 && globalAttrs.length > 0) {
            const ids = new Set<string>();
            const vals: Record<string, Set<string>> = {};
            for (const vt of variantTypes) {
                const match = globalAttrs.find(a => a.name.toLowerCase() === vt.name.toLowerCase() || a.slug === vt.id);
                if (match) {
                    ids.add(match.id);
                    vals[match.id] = new Set(vt.values.map((v: any) => v.id));
                }
            }
            if (ids.size > 0) {
                setSelectedAttrIds(ids);
                setSelectedValueIds(vals);
            }
        }
    }, [globalAttrs]);

    const toggleAttr = (attrId: string) => {
        const next = new Set(selectedAttrIds);
        if (next.has(attrId)) {
            next.delete(attrId);
            const newVals = { ...selectedValueIds };
            delete newVals[attrId];
            setSelectedValueIds(newVals);
        } else {
            next.add(attrId);
            // Pre-select all values
            const attr = globalAttrs.find(a => a.id === attrId);
            if (attr) {
                setSelectedValueIds(prev => ({ ...prev, [attrId]: new Set(attr.attribute_values.map(v => v.id)) }));
            }
        }
        setSelectedAttrIds(next);
        syncVariantTypes(next, selectedValueIds);
    };

    const toggleValue = (attrId: string, valId: string) => {
        const current = selectedValueIds[attrId] || new Set();
        const next = new Set(current);
        if (next.has(valId)) next.delete(valId);
        else next.add(valId);
        const newVals = { ...selectedValueIds, [attrId]: next };
        setSelectedValueIds(newVals);
        syncVariantTypes(selectedAttrIds, newVals);
    };

    const applyTemplate = (tpl: Template) => {
        const attrIds = new Set(tpl.variant_template_attributes.map(ta => ta.attribute_id));
        setSelectedAttrIds(attrIds);
        const vals: Record<string, Set<string>> = {};
        for (const aid of attrIds) {
            const attr = globalAttrs.find(a => a.id === aid);
            if (attr) vals[aid] = new Set(attr.attribute_values.map(v => v.id));
        }
        setSelectedValueIds(vals);
        setShowTemplatePicker(false);
        syncVariantTypes(attrIds, vals);
        toast.success(`Applied "${tpl.name}" template`);
    };

    const syncVariantTypes = (attrIds: Set<string>, valSets: Record<string, Set<string>>) => {
        const types = Array.from(attrIds).map(aid => {
            const attr = globalAttrs.find(a => a.id === aid);
            if (!attr) return null;
            const activeVals = attr.attribute_values
                .filter(v => (valSets[aid] || new Set()).has(v.id))
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(v => ({ id: v.id, name: v.value, price: 0, stock: 0, sku: "" }));
            return { id: attr.slug, name: attr.name, values: activeVals };
        }).filter(Boolean);
        setVariantTypes(types);
    };

    const generateCombinations = () => {
        const validTypes = variantTypes.filter(t => t.values.length > 0);
        if (validTypes.length === 0) { toast.error("Select at least one value per attribute"); return; }

        let combos: any[][] = validTypes[0].values.map((v: any) => [v]);
        for (let i = 1; i < validTypes.length; i++) {
            const next: any[][] = [];
            combos.forEach(combo => validTypes[i].values.forEach((v: any) => next.push([...combo, v])));
            combos = next;
        }

        if (generatedVariants.length > 0) {
            setPendingGenerate(combos);
            setConfirmReplaceOpen(true);
        } else {
            applyGenerated(combos);
        }
    };

    const applyGenerated = (combos: any[][]) => {
        const newVariants = combos.map(combo => ({
            name: combo.map((c: any) => c.name).join(" / "),
            options: combo.reduce((acc: any, c: any, idx: number) => {
                const type = variantTypes.find(t => t.values.some((v: any) => v.id === c.id));
                acc[type?.name.toLowerCase() || `opt${idx}`] = c.name;
                return acc;
            }, {}),
            attribute_value_ids: combo.map((c: any) => c.id),
            price: 0,
            stock: 0,
            sku: combo.map((c: any) => c.name.replace(/[\s"]+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")).join("-").toUpperCase(),
        }));
        setGeneratedVariants(newVariants);
        setConfirmReplaceOpen(false);
        toast.success(`Generated ${newVariants.length} variant${newVariants.length === 1 ? "" : "s"}`);
    };

    const activeAttrs = globalAttrs.filter(a => selectedAttrIds.has(a.id));
    const totalCombos = activeAttrs.reduce((n, a) => {
        const count = (selectedValueIds[a.id] || new Set()).size;
        return count > 0 ? n * count : n;
    }, activeAttrs.length > 0 ? 1 : 0);

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Variant Configuration" desc="Select global attributes and values, then generate the variant matrix." />

            {/* Template + Attribute Picker Row */}
            <div className="flex gap-3 mb-8">
                {/* Apply Template */}
                <div className="relative">
                    <Button
                        onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                        variant="outline"
                        className={cn(
                            "h-12 rounded-xl px-5 text-xs font-bold uppercase tracking-widest gap-2",
                            isDark ? "bg-[#111827] border-[#1f2937] text-[#94a3b8]" : "bg-white border-[#e2e8f0]"
                        )}
                    >
                        <Layers className="w-4 h-4" /> Apply Template <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                    {showTemplatePicker && (
                        <div className={cn(
                            "absolute top-14 left-0 z-50 w-64 rounded-2xl border shadow-2xl p-2",
                            isDark ? "bg-[#111827] border-[#1f2937]" : "bg-white border-slate-200"
                        )}>
                            {templates.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => applyTemplate(tpl)}
                                    className="w-full px-4 py-3 text-left rounded-xl hover:bg-violet-500/10 transition-colors"
                                >
                                    <p className="text-sm font-bold">{tpl.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {tpl.variant_template_attributes.length} attributes
                                    </p>
                                </button>
                            ))}
                            {templates.length === 0 && <p className="px-4 py-3 text-xs text-muted-foreground">No templates yet</p>}
                        </div>
                    )}
                </div>

                {/* Add Attribute */}
                <div className="relative flex-1">
                    <Button
                        onClick={() => setShowAttrPicker(!showAttrPicker)}
                        className="h-12 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] px-6 text-xs font-bold uppercase tracking-widest text-white gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Attribute
                    </Button>
                    {showAttrPicker && (
                        <div className={cn(
                            "absolute top-14 left-0 z-50 w-72 rounded-2xl border shadow-2xl p-2",
                            isDark ? "bg-[#111827] border-[#1f2937]" : "bg-white border-slate-200"
                        )}>
                            {globalAttrs.map(attr => (
                                <button
                                    key={attr.id}
                                    onClick={() => { toggleAttr(attr.id); }}
                                    className={cn(
                                        "w-full px-4 py-3 text-left rounded-xl flex items-center justify-between transition-colors",
                                        selectedAttrIds.has(attr.id) ? "bg-violet-500/10" : "hover:bg-muted/30"
                                    )}
                                >
                                    <div>
                                        <p className="text-sm font-bold">{attr.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{attr.attribute_values.length} values · {attr.display_type}</p>
                                    </div>
                                    {selectedAttrIds.has(attr.id) && <Check size={14} className="text-violet-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Attribute Panels */}
            <div className="grid gap-6 mb-8">
                {activeAttrs.map(attr => {
                    const activeVals = selectedValueIds[attr.id] || new Set();
                    const sortedVals = [...attr.attribute_values].sort((a, b) => a.sort_order - b.sort_order);
                    return (
                        <div key={attr.id} className={cn(
                            "p-6 rounded-2xl border transition-all relative group",
                            isDark ? "bg-[#1e293b]/30 border-[#1f2937]" : "bg-slate-50/80 border-slate-100"
                        )}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-slate-400"
                                onClick={() => toggleAttr(attr.id)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono text-[#3b82f6]">{attr.name}</span>
                                <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                                    {activeVals.size}/{sortedVals.length} selected
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sortedVals.map(val => {
                                    const isActive = activeVals.has(val.id);
                                    return (
                                        <button
                                            key={val.id}
                                            onClick={() => toggleValue(attr.id, val.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                                isActive
                                                    ? "bg-violet-500/10 border-violet-500/30 text-foreground"
                                                    : isDark
                                                        ? "bg-[#111827] border-[#1f2937] text-[#64748b] hover:border-[#334155]"
                                                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                            )}
                                        >
                                            {attr.display_type === "swatch" && val.hex_color && (
                                                <div className="h-4 w-4 rounded-full border border-border" style={{ background: val.hex_color }} />
                                            )}
                                            {val.value}
                                            {isActive && <Check size={10} className="text-violet-500 ml-0.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Matrix counter + Generate button */}
            {activeAttrs.length > 0 && (
                <div className="space-y-3">
                    <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {totalCombos} variant{totalCombos !== 1 ? "s" : ""} will be generated
                        </span>
                    </div>
                    <Button
                        onClick={generateCombinations}
                        disabled={totalCombos === 0}
                        className="w-full h-14 rounded-2xl bg-[#0f172a] dark:bg-[#3b82f6] hover:scale-[1.01] transition-transform gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10"
                    >
                        <Sparkles className="w-4 h-4" /> Generate {totalCombos} Combination{totalCombos !== 1 ? "s" : ""}
                    </Button>
                </div>
            )}

            {/* Generated Variants */}
            {generatedVariants.length > 0 && (
                <div className="mt-14 space-y-4">
                    <SectionHead title="Active Variants" desc={`${generatedVariants.length} active configurations for this product.`} />
                    {generatedVariants.map((v, i) => (
                        <div key={i} className={cn(
                            "flex items-center justify-between p-5 rounded-2xl border transition-all group hover:border-[#3b82f6] relative overflow-hidden",
                            isDark ? "bg-[#111827] border-[#1f2937]" : "bg-white border-slate-100 shadow-sm"
                        )}>
                            <div className="flex-1">
                                <p className="font-extrabold text-[#0f172a] dark:text-[#f8fafc] text-sm tracking-tight">{v.name}</p>
                                <p className="text-[9px] font-black font-mono text-[#64748b] dark:text-[#4b5563] uppercase tracking-widest mt-1">{v.sku}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="font-extrabold text-[15px] font-mono text-[#3b82f6]">
                                        <span className="text-[10px] opacity-50 mr-0.5">KES</span>
                                        {(v.price || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] mt-0.5 uppercase tracking-wider">Qty: {v.stock || 0}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setGeneratedVariants(generatedVariants.filter((_, idx) => idx !== i))}
                                    className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
                <DialogContent className="rounded-[3rem] p-10 max-w-md border-none bg-white dark:bg-[#111827] shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight">Overwrite Variants?</span>
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#64748b] dark:text-[#94a3b8] text-center leading-relaxed">
                        Generating new combinations will replace the current {generatedVariants.length} variants. This action is final.
                    </p>
                    <DialogFooter className="flex flex-col gap-3 mt-6">
                        <Button
                            onClick={() => applyGenerated(pendingGenerate)}
                            className="w-full h-12 rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-black uppercase tracking-widest text-xs"
                        >
                            Yes, Overwrite Existing
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmReplaceOpen(false)}
                            className="w-full h-12 rounded-2xl text-[#64748b] dark:text-[#94a3b8] font-bold"
                        >
                            Keep Current Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface TabSpecsProps {
    specsData: Record<string, Record<string, string>>;
    setSpecsData: (data: Record<string, Record<string, string>>) => void;
}

export function TabSpecs({ specsData, setSpecsData }: TabSpecsProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const addCategory = () => setSpecsData({ ...specsData, [`Spec Group ${Object.keys(specsData).length + 1}`]: {} });

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Technical Specs" desc="Core attributes displayed for deep technical comparison." />

            <div className="space-y-8 mt-4">
                {Object.entries(specsData).map(([category, items]) => (
                    <div key={category} className={cn(
                        "p-8 rounded-[2.5rem] border transition-all relative group",
                        isDark ? "bg-[#111827] border-[#1e293b]" : "bg-white border-slate-100 shadow-sm"
                    )}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-slate-400"
                            onClick={() => {
                                const nd = { ...specsData };
                                delete nd[category];
                                setSpecsData(nd);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        <Input
                            value={category}
                            onChange={e => {
                                const nd = { ...specsData };
                                const vals = nd[category];
                                delete nd[category];
                                nd[e.target.value] = vals;
                                setSpecsData(nd);
                            }}
                            className="text-[12px] font-black uppercase tracking-[0.25em] border-none bg-transparent p-0 h-auto focus-visible:ring-0 mb-10 font-mono text-[#3b82f6]"
                        />

                        <div className="space-y-4">
                            {Object.entries(items).map(([k, v]) => (
                                <div key={k} className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            placeholder="Label (e.g. CPU)"
                                            value={k}
                                            onChange={e => {
                                                const nd = { ...specsData };
                                                const val = nd[category][k];
                                                delete nd[category][k];
                                                nd[category][e.target.value] = val;
                                                setSpecsData(nd);
                                            }}
                                            className={cn(
                                                "h-11 px-4 rounded-xl transition-all text-[11px] font-bold font-sans uppercase tracking-widest",
                                                isDark
                                                    ? "bg-[#0f172a] border-[#1f2937] text-[#94a3b8] focus:ring-[#3b82f6]"
                                                    : "bg-white border-[#e2e8f0] text-[#64748b] focus:ring-[#3b82f6]"
                                            )}
                                        />
                                    </div>
                                    <div className="flex-[1.5] space-y-1">
                                        <Input
                                            placeholder="Value (e.g. 8-Core)"
                                            value={v}
                                            onChange={e => {
                                                const nd = { ...specsData };
                                                nd[category][k] = e.target.value;
                                                setSpecsData(nd);
                                            }}
                                            className={cn(
                                                "h-11 px-5 rounded-xl transition-all text-[13px] font-extrabold font-mono tracking-tight",
                                                isDark
                                                    ? "bg-[#0f172a] border-[#1f2937] text-[#f1f5f9] focus:ring-[#3b82f6]"
                                                    : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6]"
                                            )}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-slate-300 hover:text-red-400 rounded-xl shrink-0"
                                        onClick={() => {
                                            const nd = { ...specsData };
                                            delete nd[category][k];
                                            setSpecsData(nd);
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const nd = { ...specsData };
                                    nd[category][`Spec Key ${Date.now().toString().slice(-4)}`] = "";
                                    setSpecsData(nd);
                                }}
                                className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-dashed border-2 text-[#64748b] hover:text-[#3b82f6] hover:border-[#3b82f6] bg-transparent mt-4 transition-all"
                            >
                                <Plus className="w-3 h-3 mr-2" /> New Spec Attribute
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                onClick={addCategory}
                variant="outline"
                className="w-full mt-10 border-dashed border-2 rounded-[2rem] h-20 text-[#64748b] dark:text-[#4b5563] hover:text-[#3b82f6] hover:border-[#3b82f6] hover:bg-blue-50/10 transition-all font-bold group"
            >
                <Plus className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" /> Add New technical Spec Group
            </Button>
        </div>
    );
}
