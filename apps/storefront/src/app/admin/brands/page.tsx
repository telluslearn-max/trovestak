"use client";

import React, { useState, useEffect } from "react";
import { Plus, Globe, Trash2, Edit3 } from "lucide-react";
import Image from "next/image";
import {
    getBrandsWithCounts,
    upsertBrand,
    deleteBrand
} from "../actions";
import { toast } from "sonner";
import {
    Av, Chip, Card, StatCard, Btn, SInput, TH, TD, T, PageHeader
} from "@/components/admin/ui-pro";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function BrandsPage() {
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        country: "",
        logo_url: ""
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const brandsWithCounts = await getBrandsWithCounts();
            setBrands(brandsWithCounts);
        } catch (err: any) {
            toast.error("Failed to load brands");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (brand?: any) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({
                name: brand.name,
                slug: brand.slug || "",
                description: brand.description || "",
                country: brand.country || "",
                logo_url: brand.logo_url || ""
            });
        } else {
            setEditingBrand(null);
            setFormData({ name: "", slug: "", description: "", country: "", logo_url: "" });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return;
        const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        try {
            await upsertBrand({ ...formData, slug }, editingBrand?.id);
            toast.success(editingBrand ? "Brand updated" : "Brand registered");
            setDialogOpen(false);
            fetchBrands();
        } catch (err: any) {
            toast.error(err.message || "Failed to save");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete ${name}?`)) return;
        try {
            await deleteBrand(id);
            toast.success("Brand removed");
            fetchBrands();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        }
    };


    const filtered = brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Brands" sub={`${brands.length} brand partners`}>
                <Btn onClick={() => handleOpenDialog()}>+ Add Brand</Btn>
            </PageHeader>

            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <SInput
                    value={search}
                    onChange={(v: string) => setSearch(v)}
                    placeholder="Search brands..."
                    style={{ maxWidth: 320 }}
                />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr 80px" }}>
                    {["Brand", "Products", "Origin", "Status", ""].map(h => <TH key={h}>{h}</TH>)}
                    {loading ? (
                        <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>
                            Syncing brand registry...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>
                            No brands found.
                        </div>
                    ) : filtered.map((b, i) => [
                        <TD key={`n${i}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                {b.logo_url ? (
                                    <div style={{ position: "relative", width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, background: T.surface, padding: 4 }}>
                                        <Image
                                            src={b.logo_url}
                                            alt={b.name}
                                            fill
                                            sizes="32px"
                                            style={{ objectFit: "contain", padding: 4 }}
                                        />
                                    </div>
                                ) : (
                                    <Av l={b.name[0]} size={32} />
                                )}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{b.name}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>/{b.slug}</div>
                                </div>
                            </div>
                        </TD>,
                        <TD key={`pr${i}`} mono>{b.productCount}</TD>,
                        <TD key={`co${i}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSub }}>
                                <Globe size={12} style={{ color: T.blue }} />{b.country || "Global"}
                            </div>
                        </TD>,
                        <TD key={`st${i}`}><Chip s={b.is_active ? "active" : "inactive"} label={b.is_active ? "Live" : "Archived"} /></TD>,
                        <TD key={`ac${i}`}>
                            <div style={{ display: "flex", gap: 4 }}>
                                <Btn small variant="ghost" onClick={() => handleOpenDialog(b)}>Edit</Btn>
                                <Btn small variant="ghost" onClick={() => handleDelete(b.id, b.name)} style={{ color: T.red }}>✕</Btn>
                            </div>
                        </TD>,
                    ])}
                </div>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="border-border bg-card max-w-md">
                    <DialogHeader>
                        <DialogTitle className={T.h3}>{editingBrand ? "Edit Brand" : "New Brand"}</DialogTitle>
                    </DialogHeader>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
                        {[
                            { label: "Brand Name", key: "name", placeholder: "e.g. Apple" },
                            { label: "Country", key: "country", placeholder: "e.g. United States" },
                            { label: "Logo URL", key: "logo_url", placeholder: "https://..." },
                            { label: "Description", key: "description", placeholder: "Brand overview..." },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key}>
                                <label className={T.labelMuted}>{label}</label>
                                <SInput
                                    value={(formData as any)[key]}
                                    onChange={(v: string) => setFormData({ ...formData, [key]: v })}
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Btn variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Btn>
                        <Btn onClick={handleSave}>{editingBrand ? "Update" : "Register"}</Btn>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
