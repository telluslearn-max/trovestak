"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Edit3, Search, Check, X, Palette,
    Grid3x3, ChevronRight, Layers, Package, Shield, Filter, Hash, ArrowUpRight, Box, Tag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Av, Chip, Card, StatCard, Btn, SInput, TH, TD, T, PageHeader
} from "@/components/admin/ui-pro";
import {
    getAttributes, createAttribute, updateAttribute, deleteAttribute,
    createAttributeValue, updateAttributeValue, deleteAttributeValue,
    getTemplates, createTemplate, updateTemplateAttributes, deleteTemplate,
} from "./actions";

interface AttrValue { id: string; value: string; hex_color: string | null; sort_order: number; }
interface Attribute { id: string; name: string; slug: string; display_type: string; filterable: boolean; sort_order: number; attribute_values: AttrValue[]; }
interface Template { id: string; name: string; slug: string; variant_template_attributes: { attribute_id: string; attributes: { id: string; name: string; slug: string } }[]; }

const DISPLAY_TYPES = [
    { value: "swatch", label: "Color Swatch", icon: Palette },
    { value: "button", label: "Button", icon: Grid3x3 },
    { value: "dropdown", label: "Dropdown", icon: Filter },
];

export default function AttributesPage() {
    const [attrs, setAttrs] = useState<Attribute[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Forms
    const [showNewAttr, setShowNewAttr] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDisplayType, setNewDisplayType] = useState("button");
    const [newFilterable, setNewFilterable] = useState(true);

    const [newValue, setNewValue] = useState("");
    const [newHex, setNewHex] = useState("#3b82f6");

    const [showNewTemplate, setShowNewTemplate] = useState(false);
    const [tplName, setTplName] = useState("");
    const [tplAttrs, setTplAttrs] = useState<string[]>([]);

    const [search, setSearch] = useState("");

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [a, t] = await Promise.all([getAttributes(), getTemplates()]);
            setAttrs(a as Attribute[]);
            setTemplates(t as Template[]);
            if (!selectedId && a.length > 0) setSelectedId(a[0].id);
        } catch (err: any) {
            toast.error(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const selected = attrs.find(a => a.id === selectedId);
    const filteredAttrs = attrs.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    // Handlers
    const handleCreateAttr = () => {
        if (!newName.trim()) return;
        const slug = newName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        startTransition(async () => {
            try {
                await createAttribute({ name: newName.trim(), slug, display_type: newDisplayType, filterable: newFilterable });
                setNewName(""); setShowNewAttr(false);
                toast.success("Attribute synchronized");
                await fetchAll();
            } catch (e: any) { toast.error(e.message); }
        });
    };

    const handleDeleteAttr = (id: string) => {
        if (!confirm("Delete this attribute?")) return;
        startTransition(async () => {
            try {
                await deleteAttribute(id);
                if (selectedId === id) setSelectedId(null);
                toast.success("Attribute purged");
                await fetchAll();
            } catch (e: any) { toast.error(e.message); }
        });
    };

    const handleAddValue = () => {
        if (!newValue.trim() || !selectedId) return;
        const isSwatch = selected?.display_type === "swatch";
        startTransition(async () => {
            try {
                await createAttributeValue({
                    attribute_id: selectedId!,
                    value: newValue.trim(),
                    hex_color: isSwatch ? newHex : undefined,
                    sort_order: (selected?.attribute_values?.length || 0) + 1,
                });
                setNewValue("");
                toast.success("Dictionary updated");
                await fetchAll();
            } catch (e: any) { toast.error(e.message); }
        });
    };

    const handleDeleteValue = (valId: string) => {
        startTransition(async () => {
            try {
                await deleteAttributeValue(valId);
                toast.success("Entry removed");
                await fetchAll();
            } catch (e: any) { toast.error(e.message); }
        });
    };

    const handleCreateTemplate = () => {
        if (!tplName.trim()) return;
        const slug = tplName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        startTransition(async () => {
            try {
                await createTemplate({ name: tplName.trim(), slug, attribute_ids: tplAttrs });
                setTplName(""); setTplAttrs([]); setShowNewTemplate(false);
                toast.success("Blueprint stored");
                await fetchAll();
            } catch (e: any) { toast.error(e.message); }
        });
    };

    const handleDeleteTemplate = (id: string) => {
        if (!confirm("Delete template?")) return;
        startTransition(async () => {
            try {
                await deleteTemplate(id);
                toast.success("Blueprint deleted");
                await fetchAll();
            } catch (e: any) { toast.error(e.message); }
        });
    };

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Attributes & Variants" sub="Global attribute dictionary — used across all products">
                <Btn onClick={() => setShowNewAttr(true)}>+ Add Attribute</Btn>
            </PageHeader>

            <AnimatePresence>
                {showNewAttr && (
                    <Card style={{ padding: "20px 24px", marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>New Attribute</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6, display: "block" }}>Name</label>
                                <SInput
                                    value={newName}
                                    onChange={(v: string) => setNewName(v)}
                                    placeholder="e.g. Color"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6, display: "block" }}>Display Type</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {DISPLAY_TYPES.map(dt => (
                                        <Btn
                                            key={dt.value}
                                            variant={newDisplayType === dt.value ? "primary" : "ghost"}
                                            small
                                            onClick={() => setNewDisplayType(dt.value)}
                                            style={{ flex: 1 }}
                                        >
                                            <dt.icon size={14} /> {dt.label}
                                        </Btn>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <Btn variant="ghost" small onClick={() => setShowNewAttr(false)}>Cancel</Btn>
                            <Btn small onClick={handleCreateAttr} disabled={isPending}>Create Attribute</Btn>
                        </div>
                    </Card>
                )}
            </AnimatePresence>

            {/* Attributes Stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {attrs.map(a => (
                    <Card key={a.id} style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: T.textSub }}>
                                    Display: <span style={{ color: T.blue, fontWeight: 600 }}>{a.display_type}</span> ·
                                    Slug: <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10 }}>/{a.slug}</span> ·
                                    Values: {a.attribute_values?.length || 0}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Btn variant="ghost" small onClick={() => {
                                    setSelectedId(a.id);
                                    // Normally we might open an edit modal or inline expand
                                }}>Edit</Btn>
                                <Btn variant="ghost" small onClick={() => handleDeleteAttr(a.id)} style={{ color: T.red }}>Purge</Btn>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {a.attribute_values?.sort((va, vb) => va.sort_order - vb.sort_order).map(v => (
                                <div key={v.id} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 11,
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    padding: "4px 10px",
                                    color: T.text
                                }}>
                                    {a.display_type === "swatch" && v.hex_color && (
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: v.hex_color }} />
                                    )}
                                    {v.value}
                                    <button
                                        onClick={() => handleDeleteValue(v.id)}
                                        style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 12, marginLeft: 4, padding: 0 }}
                                    >✕</button>
                                </div>
                            ))}
                            <div style={{ position: "relative", display: "flex", gap: 6 }}>
                                {selectedId === a.id && (
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {a.display_type === "swatch" && (
                                            <input
                                                type="color"
                                                value={newHex}
                                                onChange={e => setNewHex(e.target.value)}
                                                style={{ width: 26, height: 26, padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer" }}
                                            />
                                        )}
                                        <input
                                            value={newValue}
                                            onChange={e => setNewValue(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleAddValue()}
                                            placeholder="Value..."
                                            style={{
                                                fontSize: 11,
                                                background: "transparent",
                                                border: `1px solid ${T.blue}`,
                                                borderRadius: 6,
                                                padding: "4px 10px",
                                                color: T.text,
                                                width: 80,
                                                outline: "none"
                                            }}
                                            autoFocus
                                        />
                                        <Btn variant="ghost" small onClick={handleAddValue} style={{ padding: "0 8px", height: 26 }}>+</Btn>
                                        <Btn variant="ghost" small onClick={() => setSelectedId(null)} style={{ padding: "0 8px", height: 26 }}>✕</Btn>
                                    </div>
                                )}
                                {selectedId !== a.id && (
                                    <button
                                        onClick={() => { setSelectedId(a.id); setNewValue(""); }}
                                        style={{ fontSize: 11, background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.textMuted, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}
                                    >+ Add value</button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Templates Section (Variant Blueprints) */}
            <div style={{ marginTop: 40 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>Variant Blueprints</h2>
                        <p style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>Templates for consistent product variation creation.</p>
                    </div>
                    <Btn onClick={() => setShowNewTemplate(true)}>+ New Blueprint</Btn>
                </div>

                <AnimatePresence>
                    {showNewTemplate && (
                        <Card style={{ padding: "24px", marginBottom: 24 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20 }}>New Template</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, display: "block" }}>Blueprint Name</label>
                                    <SInput value={tplName} onChange={(v: string) => setTplName(v)} placeholder="e.g. Shoe Sizes" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, display: "block" }}>Include Attributes</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {attrs.map(a => (
                                            <button
                                                key={a.id}
                                                onClick={() => tplAttrs.includes(a.id) ? setTplAttrs(tplAttrs.filter(x => x !== a.id)) : setTplAttrs([...tplAttrs, a.id])}
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: 6,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    border: `1px solid ${tplAttrs.includes(a.id) ? T.blue : T.border}`,
                                                    background: tplAttrs.includes(a.id) ? T.blue + "20" : "transparent",
                                                    color: tplAttrs.includes(a.id) ? T.blue : T.textSub,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {a.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <Btn variant="ghost" small onClick={() => setShowNewTemplate(false)}>Cancel</Btn>
                                <Btn small onClick={handleCreateTemplate}>Save Blueprint</Btn>
                            </div>
                        </Card>
                    )}
                </AnimatePresence>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    {templates.map(tpl => (
                        <Card key={tpl.id} style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{tpl.name}</div>
                                    <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>/{tpl.slug}</div>
                                </div>
                                <Btn variant="ghost" small onClick={() => handleDeleteTemplate(tpl.id)} style={{ color: T.red }}>✕</Btn>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                {tpl.variant_template_attributes?.map(ta => (
                                    <Chip key={ta.attribute_id} s="inactive">{ta.attributes?.name}</Chip>
                                ))}
                            </div>
                            <Btn variant="ghost" small style={{ width: "100%" }}>Edit Blueprint</Btn>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
