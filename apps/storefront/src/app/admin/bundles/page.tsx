"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
    Plus, Trash2, Search, X,
    Package, Grid, Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
    getBundles, createBundle, updateBundle, deleteBundle,
    addBundleItem, removeBundleItem, addBundleSlot,
    deleteBundleSlot, addSlotOption, removeSlotOption,
    searchVariants, BundleType, BundleStatus
} from "./actions";
import { Card, Btn, SInput, TH, TD, T, PageHeader, Chip } from "@/components/admin/ui-pro";

interface Bundle {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: BundleStatus;
    bundle_type: BundleType;
    price_override: number | null;
    discount_type: string | null;
    discount_value: number | null;
    bundle_items: BundleItem[];
    bundle_slots: BundleSlot[];
    created_at: string;
}

interface BundleItem {
    id: string;
    quantity: number;
    product_variant_id: string;
    product_variants: Variant;
}

interface BundleSlot {
    id: string;
    slot_name: string;
    required: boolean;
    sort_order: number;
    bundle_slot_options: SlotOption[];
}

interface SlotOption {
    id: string;
    price_modifier: number;
    product_variant_id: string;
    product_variants: Variant;
}

interface Variant {
    id: string;
    name: string;
    sku: string;
    price_kes: number;
    stock_quantity: number;
    products: {
        id: string;
        name: string;
        thumbnail_url: string | null;
    };
}

const fmt = (n: number) => `KES ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function BundlesPage() {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [view, setView] = useState<"list" | "create" | "edit">("list");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        status: "draft" as BundleStatus,
        bundle_type: "fixed" as BundleType,
        price_override: "" as string | number,
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

    const fetchBundles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getBundles();
            setBundles(data as Bundle[]);
        } catch {
            toast.error("Failed to load bundles");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBundles(); }, [fetchBundles]);

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const results = await searchVariants(q);
            setSearchResults(results);
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = () => {
        if (!formData.name.trim()) return;
        startTransition(async () => {
            try {
                const slug = formData.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                const bundle = await createBundle({
                    ...formData,
                    slug,
                    price_override: formData.price_override ? Number(formData.price_override) : undefined,
                } as any);
                setEditingId(bundle.id);
                setView("edit");
                toast.success("Bundle created — now add items!");
                await fetchBundles();
            } catch (err: any) { toast.error(err.message); }
        });
    };

    const currentBundle = bundles.find(b => b.id === editingId);

    const handleAddItem = (variant: any) => {
        if (!editingId) return;
        startTransition(async () => {
            try {
                await addBundleItem(editingId, variant.id, 1);
                toast.success(`Added ${variant.name}`);
                await fetchBundles();
                setSearchQuery(""); setSearchResults([]);
            } catch (err: any) { toast.error(err.message); }
        });
    };

    const handleAddOption = (slotId: string, variant: any) => {
        startTransition(async () => {
            try {
                await addSlotOption(slotId, variant.id, 0);
                toast.success(`Added ${variant.name} to slot`);
                await fetchBundles();
                setSearchQuery(""); setSearchResults([]);
            } catch (err: any) { toast.error(err.message); }
        });
    };

    // ── LIST VIEW ─────────────────────────────────────────────────────
    if (view === "list") {
        return (
            <div className="page-enter" style={{ padding: "32px" }}>
                <PageHeader title="Bundles & Kits" sub="Fixed bundles and configurable kits">
                    <Btn onClick={() => {
                        setFormData({ name: "", slug: "", description: "", status: "draft", bundle_type: "fixed", price_override: "" });
                        setEditingId(null);
                        setView("create");
                    }}>+ Create Bundle</Btn>
                </PageHeader>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>Loading bundles...</div>
                ) : bundles.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>No bundles yet. Create your first product bundle.</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                        {bundles.map(b => (
                            <Card key={b.id} style={{ padding: "22px 24px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{b.name}</div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <span style={{
                                                fontSize: 10,
                                                background: b.bundle_type === "configurable" ? T.purple + "20" : T.blue + "20",
                                                color: b.bundle_type === "configurable" ? T.purple : T.blue,
                                                borderRadius: 5,
                                                padding: "2px 8px",
                                                fontWeight: 700,
                                                letterSpacing: ".04em"
                                            }}>{b.bundle_type.toUpperCase()}</span>
                                            <Chip s={b.status} />
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>
                                            {b.price_override ? fmt(b.price_override) : "Dynamic"}
                                        </div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>
                                            {b.bundle_type === "fixed"
                                                ? `${b.bundle_items?.length || 0} items`
                                                : `${b.bundle_slots?.length || 0} slots`}
                                        </div>
                                    </div>
                                </div>
                                {b.description && (
                                    <div style={{ fontSize: 11, color: T.textSub, marginBottom: 16 }}>{b.description}</div>
                                )}
                                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                    <Btn small variant="ghost" onClick={() => {
                                        setEditingId(b.id);
                                        setFormData({
                                            name: b.name, slug: b.slug,
                                            description: b.description || "",
                                            status: b.status, bundle_type: b.bundle_type,
                                            price_override: b.price_override || "",
                                        });
                                        setView("edit");
                                    }}>Edit</Btn>
                                    <Btn small variant="ghost" onClick={() => {
                                        if (confirm("Delete this bundle?")) {
                                            startTransition(async () => {
                                                try { await deleteBundle(b.id); toast.success("Bundle deleted"); await fetchBundles(); }
                                                catch (e: any) { toast.error(e.message); }
                                            });
                                        }
                                    }} style={{ color: T.red }}>Delete</Btn>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── CREATE VIEW ────────────────────────────────────────────────────
    if (view === "create") {
        return (
            <div className="page-enter" style={{ padding: "32px" }}>
                <PageHeader title="Create Bundle" sub="Define a new fixed bundle or configurable kit">
                    <Btn variant="ghost" onClick={() => setView("list")}>← Back</Btn>
                </PageHeader>

                <Card style={{ padding: "28px", maxWidth: 600 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <label className={T.labelMuted}>Bundle Name</label>
                            <SInput value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} placeholder="e.g. PlayStation 5 Starter Pack" />
                        </div>
                        <div>
                            <label className={T.labelMuted}>Type</label>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                {[{ id: "fixed", label: "Fixed Bundle" }, { id: "configurable", label: "Configurable Kit" }].map(t => (
                                    <Btn
                                        key={t.id}
                                        variant={formData.bundle_type === t.id ? "primary" : "ghost"}
                                        small
                                        onClick={() => setFormData({ ...formData, bundle_type: t.id as BundleType })}
                                        style={{ flex: 1 }}
                                    >{t.label}</Btn>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={T.labelMuted}>Price Override (KES)</label>
                            <SInput value={String(formData.price_override)} onChange={(v: string) => setFormData({ ...formData, price_override: v })} placeholder="0 (leave blank for dynamic)" />
                        </div>
                        <div>
                            <label className={T.labelMuted}>Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as BundleStatus })}
                                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.text, fontFamily: "'Syne', sans-serif", marginTop: 6 }}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label className={T.labelMuted}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Bundle description..."
                                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.text, fontFamily: "'Syne', sans-serif", resize: "vertical", marginTop: 6 }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <Btn variant="ghost" onClick={() => setView("list")}>Cancel</Btn>
                            <Btn onClick={handleCreate} disabled={isPending || !formData.name.trim()}>
                                {isPending ? "Creating..." : "Create Bundle"}
                            </Btn>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // ── EDIT VIEW ─────────────────────────────────────────────────────
    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title={currentBundle?.name || "Edit Bundle"} sub={`${currentBundle?.bundle_type === "fixed" ? "Fixed Bundle" : "Configurable Kit"} · ${currentBundle?.status}`}>
                <Btn variant="ghost" onClick={() => { setView("list"); setEditingId(null); }}>← All Bundles</Btn>
                <Btn variant="ghost" onClick={() => {
                    if (confirm("Delete this bundle?")) {
                        startTransition(async () => {
                            try { await deleteBundle(editingId!); toast.success("Bundle deleted"); setView("list"); await fetchBundles(); }
                            catch (e: any) { toast.error(e.message); }
                        });
                    }
                }} style={{ color: T.red }}>Delete</Btn>
            </PageHeader>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                {/* Sidebar */}
                <Card style={{ padding: "24px", alignSelf: "start" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>Bundle Metadata</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label className={T.labelMuted}>Name</label>
                            <SInput value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} placeholder="Bundle name" />
                        </div>
                        <div>
                            <label className={T.labelMuted}>Price (KES)</label>
                            <SInput value={String(formData.price_override)} onChange={(v: string) => setFormData({ ...formData, price_override: v })} placeholder="Override price" />
                        </div>
                        <div>
                            <label className={T.labelMuted}>Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as BundleStatus })}
                                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "'Syne', sans-serif" }}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <Btn onClick={() => {
                            startTransition(async () => {
                                try {
                                    await updateBundle(editingId!, {
                                        name: formData.name,
                                        description: formData.description,
                                        status: formData.status,
                                        price_override: formData.price_override ? Number(formData.price_override) : undefined,
                                    } as any);
                                    toast.success("Bundle updated");
                                    await fetchBundles();
                                } catch (e: any) { toast.error(e.message); }
                            });
                        }}>Save Changes</Btn>
                    </div>
                </Card>

                {/* Main workspace */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Search for variants */}
                    <Card style={{ padding: "20px 24px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                            {currentBundle?.bundle_type === "fixed" ? "Add Products" : "Add to Slot"}
                        </div>
                        <SInput
                            value={searchQuery}
                            onChange={(v: string) => handleSearch(v)}
                            placeholder="Search products by name or SKU..."
                        />
                        {searchResults.length > 0 && (
                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                {searchResults.map(v => (
                                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v.name}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{v.sku} · KES {v.price_kes?.toLocaleString()}</div>
                                        </div>
                                        {currentBundle?.bundle_type === "fixed" ? (
                                            <Btn small onClick={() => handleAddItem(v)}>+ Add</Btn>
                                        ) : (
                                            <div style={{ display: "flex", gap: 6 }}>
                                                {currentBundle?.bundle_slots?.map(slot => (
                                                    <Btn key={slot.id} small variant="ghost" onClick={() => handleAddOption(slot.id, v)}>
                                                        → {slot.slot_name.split(" ")[0]}
                                                    </Btn>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Bundle contents */}
                    {currentBundle?.bundle_type === "fixed" ? (
                        <Card style={{ padding: "20px 24px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                                Fixed Manifest · {currentBundle.bundle_items?.length || 0} items
                            </div>
                            {(!currentBundle.bundle_items || currentBundle.bundle_items.length === 0) ? (
                                <div style={{ padding: "32px", textAlign: "center", color: T.textMuted, fontSize: 12, border: `1px dashed ${T.border}`, borderRadius: 10 }}>
                                    Search above to add products to this bundle.
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {currentBundle.bundle_items?.map(item => (
                                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.product_variants?.name || "Unknown"}</div>
                                                <div style={{ fontSize: 10, color: T.textMuted }}>
                                                    QTY: {item.quantity} · KES {item.product_variants?.price_kes?.toLocaleString()}
                                                </div>
                                            </div>
                                            <Btn small variant="ghost" style={{ color: T.red }} onClick={() => {
                                                startTransition(async () => {
                                                    try { await removeBundleItem(item.id); toast.success("Item removed"); await fetchBundles(); }
                                                    catch (e: any) { toast.error(e.message); }
                                                });
                                            }}>✕</Btn>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                                    Kit Slots · {currentBundle?.bundle_slots?.length || 0} slots
                                </div>
                                <Btn small onClick={() => {
                                    const name = prompt("Slot name (e.g. Choose Monitor)");
                                    if (name) {
                                        startTransition(async () => {
                                            try { await addBundleSlot(editingId!, name); toast.success(`Slot "${name}" created`); await fetchBundles(); }
                                            catch (e: any) { toast.error(e.message); }
                                        });
                                    }
                                }}>+ Add Slot</Btn>
                            </div>
                            {(!currentBundle?.bundle_slots || currentBundle.bundle_slots.length === 0) ? (
                                <div style={{ padding: "32px", textAlign: "center", color: T.textMuted, fontSize: 12, border: `1px dashed ${T.border}`, borderRadius: 10 }}>
                                    Add slots to configure choice groups.
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {currentBundle?.bundle_slots?.map(slot => (
                                        <div key={slot.id} style={{ background: T.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{slot.slot_name}</div>
                                                <Btn small variant="ghost" style={{ color: T.red }} onClick={() => {
                                                    if (confirm("Delete this slot?")) {
                                                        startTransition(async () => {
                                                            try { await deleteBundleSlot(slot.id); toast.success("Slot deleted"); await fetchBundles(); }
                                                            catch (e: any) { toast.error(e.message); }
                                                        });
                                                    }
                                                }}>✕</Btn>
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                {slot.bundle_slot_options?.map(opt => (
                                                    <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: T.text }}>
                                                        {opt.product_variants?.name}
                                                        <button onClick={() => {
                                                            startTransition(async () => {
                                                                try { await removeSlotOption(opt.id); toast.success("Option removed"); await fetchBundles(); }
                                                                catch (e: any) { toast.error(e.message); }
                                                            });
                                                        }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
                                                    </div>
                                                ))}
                                                {slot.bundle_slot_options?.length === 0 && (
                                                    <span style={{ fontSize: 11, color: T.textMuted }}>Search above and click "→ {slot.slot_name.split(" ")[0]}" to add options</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
