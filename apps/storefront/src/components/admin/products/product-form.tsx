"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Save, Loader2, ArrowLeft, AlertCircle, Info, Image as ImageIcon,
    DollarSign, Package, Layers, Settings, Truck, Search, Layout,
    Globe, Plus, X, ChevronLeft, ChevronRight, Tag, BarChart2,
    CheckCircle, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getProductById, upsertProduct } from "@/app/admin/products/actions";
import { cn } from "@/lib/utils";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { motion, AnimatePresence } from "framer-motion";
import { megaMenuData, mainCategories } from "@/lib/megamenu";
import type { ProductData } from "@/components/admin/products/product-data-card";

// ── CONSTANTS ──────────────────────────────────────────────────────

const BRANDS = [
    "Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft",
    "Google", "OnePlus", "Xiaomi", "OPPO", "vivo", "Realme", "Infinix", "Tecno", "Nokia",
    "JBL", "Bose", "Beats", "Garmin", "Fitbit", "Amazfit", "DJI", "Canon", "Nikon",
    "PlayStation", "Xbox", "Nintendo", "Starlink", "TCL", "Hisense", "Vision Plus", "Other"
];

const NAV_CATEGORIES = [
    "smartphones", "laptops", "tablets", "televisions", "audio",
    "cameras", "gaming", "wearables", "smart-home", "accessories"
];

const TABS = [
    { id: "general",      label: "General",      icon: Info,       requiredFields: ["name", "description"] },
    { id: "media",        label: "Media",         icon: ImageIcon,  requiredFields: ["thumbnail_url"] },
    { id: "pricing",      label: "Pricing",       icon: DollarSign, requiredFields: ["sell_price"] },
    { id: "inventory",    label: "Inventory",     icon: Package,    requiredFields: ["sku", "stock_quantity"] },
    { id: "variants",     label: "Variants",      icon: Layers,     requiredFields: [] },
    { id: "specs",        label: "Specs",         icon: Settings,   requiredFields: [] },
    { id: "shipping",     label: "Shipping",      icon: Truck,      requiredFields: ["weight"] },
    { id: "seo",          label: "SEO",           icon: Search,     requiredFields: ["seo_title", "seo_description"] },
    { id: "organization", label: "Organization",  icon: Globe,      requiredFields: ["brand", "nav_category"] },
];

const uid = () => Math.random().toString(36).slice(2, 8);

interface VariantRow {
    id: string;
    color: string;
    storage: string;
    price_kes: string;
    sku: string;
    stock: string;
}

interface SpecRow { id: string; label: string; value: string; }
interface SpecGroup { id: string; label: string; rows: SpecRow[]; }

interface ProductFormProps {
    productId?: string;
}

// ── COMPLETION TRACKER ─────────────────────────────────────────────

function getCompletionScore(data: ProductData, variants: VariantRow[], specGroups: SpecGroup[]): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const tab of TABS) {
        if (tab.requiredFields.length === 0) {
            // Special cases
            if (tab.id === "variants") scores[tab.id] = variants.length > 0 ? 100 : 0;
            else if (tab.id === "specs") scores[tab.id] = specGroups.some(g => g.rows.some(r => r.value)) ? 100 : 0;
            else scores[tab.id] = 0;
            continue;
        }
        const filled = tab.requiredFields.filter(f => {
            const v = (data as any)[f];
            if (v === undefined || v === null || v === "" || v === 0) return false;
            return true;
        });
        scores[tab.id] = Math.round((filled.length / tab.requiredFields.length) * 100);
    }
    return scores;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────

export function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const isNew = !productId;

    const [activeTab, setActiveTab] = useState("general");
    const [productLoading, setProductLoading] = useState(!!productId);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showMediaLibrary, setShowMediaLibrary] = useState<"main" | "gallery" | null>(null);

    // Core product fields
    const [basicInfo, setBasicInfo] = useState({ name: "", slug: "", description: "", status: "draft" });
    const [productData, setProductData] = useState<ProductData>({
        product_type: "simple",
        stock_status: "instock",
        low_stock_threshold: 5,
        is_active: true,
        visibility: "catalog",
        warehouse: "main",
        allow_backorders: "no",
        shipping_class: "standard",
        country_of_origin: "cn",
    });

    // Variant table state
    const [variants, setVariants] = useState<VariantRow[]>([]);

    // Spec groups state
    const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
    const [specsEnabled, setSpecsEnabled] = useState(true);

    // Tag input state
    const [tagInput, setTagInput] = useState("");

    // Category
    const [mainCategory, setMainCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [subSubCategory, setSubSubCategory] = useState("");
    const currentMegaMenu = mainCategory ? megaMenuData[mainCategory] : null;

    const set = useCallback(<K extends keyof ProductData>(field: K, value: ProductData[K]) => {
        setProductData(prev => ({ ...prev, [field]: value }));
    }, []);

    const autoSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Load existing product
    useEffect(() => {
        async function loadData() {
            if (!productId) return;
            setProductLoading(true);
            try {
                const { product, primaryCategoryId } = await getProductById(productId);
                if (product) {
                    setBasicInfo({
                        name: product.name || "",
                        slug: product.slug || "",
                        description: product.description || "",
                        status: (product as any).status || (product.is_active ? "published" : "draft"),
                    });
                    setProductData({
                        cost_price: product.cost_price,
                        sell_price: product.sell_price,
                        sale_price: product.sale_price,
                        product_type: product.product_type || "simple",
                        sku: product.sku,
                        barcode: product.barcode,
                        stock_quantity: product.stock_quantity,
                        stock_status: product.stock_status || "instock",
                        low_stock_threshold: product.low_stock_threshold || 5,
                        allow_backorders: product.allow_backorders || "no",
                        warehouse: product.warehouse || "main",
                        brand: product.brand,
                        nav_category: product.nav_category,
                        tags: product.tags,
                        thumbnail_url: product.thumbnail_url,
                        images: product.images,
                        is_featured: product.is_featured,
                        visibility: product.visibility || "catalog",
                        purchase_note: product.purchase_note,
                        menu_order: product.menu_order,
                        is_active: product.is_active,
                        weight: product.weight,
                        length: product.length,
                        width: product.width,
                        height: product.height,
                        shipping_class: product.shipping_class || "standard",
                        country_of_origin: product.country_of_origin || "cn",
                        hs_code: product.hs_code,
                        seo_title: product.seo_title,
                        seo_description: product.seo_description,
                        seo_canonical: product.seo_canonical,
                    });
                    if (primaryCategoryId) setMainCategory(primaryCategoryId);
                }
            } catch (err) {
                console.error("Failed to load product", err);
            } finally {
                setProductLoading(false);
            }
        }
        loadData();
    }, [productId]);

    const onSubmit = async (e: React.FormEvent, status?: string) => {
        e.preventDefault();
        if (!basicInfo.name.trim()) {
            setSaveError("Product name is required");
            setActiveTab("general");
            return;
        }
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            const slug = basicInfo.slug || autoSlug(basicInfo.name);
            const categorySlug = subSubCategory || subCategory || mainCategory;
            const payload = {
                name: basicInfo.name,
                slug,
                description: basicInfo.description,
                ...productData,
                status: status || basicInfo.status,
            };
            const result = await upsertProduct(productId || null, payload, categorySlug || undefined);
            if (result.success) {
                setSaveSuccess(true);
                if (isNew && result.product) {
                    router.push(`/admin/products/${result.product.id}`);
                } else {
                    router.refresh();
                }
            }
        } catch (err: any) {
            console.error("Save error:", err);
            setSaveError(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const completion = getCompletionScore(
        { ...productData, ...basicInfo } as ProductData,
        variants,
        specGroups
    );
    const overallPct = Math.round(
        Object.values(completion).reduce((a, v) => a + v, 0) / TABS.length
    );

    const tabIndex = TABS.findIndex(t => t.id === activeTab);

    if (productLoading && productId) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="max-w-[1400px] mx-auto space-y-8 font-sans">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between pb-6 border-b border-border/40">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all">
                        <Link href="/admin/products"><ArrowLeft className="w-5 h-5" /></Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tight">
                            {isNew ? "New Product" : "Edit Product"}
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            overallPct > 66 ? "bg-green-500" : overallPct > 33 ? "bg-amber-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${overallPct}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground">{overallPct}% complete</span>
                            </div>
                            {basicInfo.name && (
                                <span className="text-[10px] text-muted-foreground/50">· {basicInfo.name}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {saveSuccess && (
                            <motion.span
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-green-500 text-xs font-bold uppercase tracking-widest px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full flex items-center gap-1.5"
                            >
                                <CheckCircle className="w-3 h-3" /> Saved
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={saving}
                        onClick={(e) => onSubmit(e as any, "draft")}
                        className="rounded-xl h-10 px-5 text-[11px] font-bold uppercase tracking-wider"
                    >
                        Save Draft
                    </Button>
                    <Button
                        type="button"
                        disabled={saving}
                        onClick={(e) => onSubmit(e as any, "published")}
                        className="h-10 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? "Saving..." : isNew ? "Publish" : "Save Changes"}
                    </Button>
                </div>
            </div>

            {saveError && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {saveError}
                </div>
            )}

            {/* ── BODY ── */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* ── SIDEBAR ── */}
                <div className="w-full lg:w-56 shrink-0 sticky top-6">
                    <div className="border border-border/40 rounded-2xl overflow-hidden bg-card">
                        {TABS.map((tab, i) => {
                            const isActive = activeTab === tab.id;
                            const pct = completion[tab.id] ?? 0;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 w-full px-4 py-3 text-left transition-all text-sm",
                                        i < TABS.length - 1 && "border-b border-border/30",
                                        isActive
                                            ? "bg-primary/5 text-primary font-semibold border-l-2 border-l-primary"
                                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground font-medium"
                                    )}
                                >
                                    <tab.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "opacity-50")} />
                                    <span className="flex-1 truncate">{tab.label}</span>
                                    {pct === 100
                                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                        : pct > 0
                                        ? <span className="text-[9px] font-mono text-amber-500 shrink-0">{pct}%</span>
                                        : null
                                    }
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── CONTENT ── */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="border border-border/40 rounded-2xl bg-card p-8 space-y-8"
                        >
                            {/* Tab header */}
                            <div className="pb-6 border-b border-border/30">
                                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1">
                                    {tabIndex + 1} of {TABS.length}
                                </p>
                                <h3 className="text-xl font-bold tracking-tight">
                                    {TABS[tabIndex]?.label}
                                </h3>
                            </div>

                            {/* ── GENERAL ── */}
                            {activeTab === "general" && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name</Label>
                                        <Input
                                            value={basicInfo.name}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                setBasicInfo(prev => ({ ...prev, name, slug: autoSlug(name) }));
                                            }}
                                            placeholder="e.g. Samsung Galaxy S25 Ultra"
                                            className="h-12 rounded-xl bg-background border-border/60"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL Slug <span className="normal-case font-normal">(auto)</span></Label>
                                            <Input
                                                value={basicInfo.slug}
                                                onChange={(e) => setBasicInfo(prev => ({ ...prev, slug: e.target.value }))}
                                                placeholder="samsung-galaxy-s25-ultra"
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visibility</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.visibility || "catalog"}
                                                onChange={(e) => set("visibility", e.target.value as any)}
                                            >
                                                <option value="catalog">Visible in Catalog</option>
                                                <option value="search">Search Only</option>
                                                <option value="hidden">Hidden</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={basicInfo.status}
                                                onChange={(e) => setBasicInfo(prev => ({ ...prev, status: e.target.value }))}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Short Description <span className="normal-case font-normal">— shown in listing cards</span></Label>
                                        <Input
                                            value={productData.short_description || ""}
                                            onChange={(e) => set("short_description", e.target.value)}
                                            placeholder="One punchy line highlighting top 3 features..."
                                            className="h-12 rounded-xl bg-background border-border/60"
                                        />
                                        <p className={cn(
                                            "text-right text-[10px] font-mono",
                                            (productData.short_description?.length ?? 0) > 140 ? "text-red-500" : "text-muted-foreground/50"
                                        )}>
                                            {productData.short_description?.length ?? 0} / 160
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                                        <Textarea
                                            value={basicInfo.description}
                                            onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Full product description, marketing copy, key features..."
                                            className="min-h-[180px] rounded-xl bg-background border-border/60 leading-relaxed"
                                        />
                                    </div>

                                    {/* Category cascade */}
                                    <div className="pt-4 border-t border-border/20 space-y-4">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <select
                                                className="flex h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm"
                                                value={mainCategory}
                                                onChange={(e) => { setMainCategory(e.target.value); setSubCategory(""); setSubSubCategory(""); }}
                                            >
                                                <option value="">Main category...</option>
                                                {mainCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            {currentMegaMenu && (
                                                <select
                                                    className="flex h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm"
                                                    value={subCategory}
                                                    onChange={(e) => { setSubCategory(e.target.value); setSubSubCategory(""); }}
                                                >
                                                    <option value="">Subcategory...</option>
                                                    {currentMegaMenu.columns.map((col: any) => (
                                                        <option key={col.title} value={col.title}>{col.title}</option>
                                                    ))}
                                                </select>
                                            )}
                                            {currentMegaMenu && subCategory && (
                                                <select
                                                    className="flex h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm"
                                                    value={subSubCategory}
                                                    onChange={(e) => setSubSubCategory(e.target.value)}
                                                >
                                                    <option value="">Segment...</option>
                                                    {currentMegaMenu.columns
                                                        .find((col: any) => col.title === subCategory)
                                                        ?.items.map((item: any) => (
                                                            <option key={item.category} value={item.category}>{item.category}</option>
                                                        ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── MEDIA ── */}
                            {activeTab === "media" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Main image */}
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Main Image</Label>
                                            <div
                                                onClick={() => setShowMediaLibrary("main")}
                                                className="aspect-video rounded-xl border-2 border-dashed border-border/40 bg-background hover:border-primary/40 transition-all cursor-pointer group flex flex-col items-center justify-center gap-3 overflow-hidden relative"
                                            >
                                                {productData.thumbnail_url ? (
                                                    <>
                                                        <img src={productData.thumbnail_url} alt="Main" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button type="button" variant="secondary" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-wider">Replace</Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-8 h-8 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Select Main Image</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Gallery */}
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gallery</Label>
                                            <div
                                                onClick={() => setShowMediaLibrary("gallery")}
                                                className="aspect-video rounded-xl border-2 border-dashed border-border/40 bg-background hover:border-primary/40 transition-all cursor-pointer group flex items-center justify-center gap-4 overflow-hidden relative"
                                            >
                                                {productData.images && productData.images.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-2 w-full h-full p-3">
                                                        {productData.images.slice(0, 4).map((url, i) => (
                                                            <div key={i} className="rounded-lg overflow-hidden border border-border/20 relative">
                                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                                {i === 3 && productData.images!.length > 4 && (
                                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                                                                        +{productData.images!.length - 4}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                            <Button type="button" variant="secondary" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-wider">Manage Gallery</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Layers className="w-8 h-8 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Add Gallery Images</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/50">
                                        JPG, PNG, WebP · Max 5MB per image · Recommended: 1200×1200px · First image = main thumbnail
                                    </p>
                                </div>
                            )}

                            {/* ── PRICING ── */}
                            {activeTab === "pricing" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sell Price (KES)</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/50">KES</span>
                                                <Input
                                                    type="number"
                                                    value={productData.sell_price || ""}
                                                    onChange={(e) => set("sell_price", parseFloat(e.target.value) || undefined)}
                                                    className="h-12 pl-14 rounded-xl bg-background border-border/60 font-mono"
                                                    placeholder="75000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Compare-at Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/50">KES</span>
                                                <Input
                                                    type="number"
                                                    value={productData.sale_price || ""}
                                                    onChange={(e) => set("sale_price", parseFloat(e.target.value) || undefined)}
                                                    className="h-12 pl-14 rounded-xl bg-background border-border/60 font-mono opacity-70"
                                                    placeholder="90000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cost Price (internal)</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/50">KES</span>
                                                <Input
                                                    type="number"
                                                    value={productData.cost_price || ""}
                                                    onChange={(e) => set("cost_price", parseFloat(e.target.value) || undefined)}
                                                    className="h-12 pl-14 rounded-xl bg-background border-border/60 font-mono opacity-70"
                                                    placeholder="55000"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live margin calculator */}
                                    {(productData.sell_price || productData.cost_price || productData.sale_price) ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {productData.sell_price && productData.cost_price && (
                                                <>
                                                    <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
                                                        <p className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Margin</p>
                                                        <p className={cn(
                                                            "text-2xl font-black font-mono",
                                                            ((productData.sell_price - productData.cost_price) / productData.sell_price * 100) > 30 ? "text-green-500"
                                                            : ((productData.sell_price - productData.cost_price) / productData.sell_price * 100) > 10 ? "text-amber-500"
                                                            : "text-red-500"
                                                        )}>
                                                            {Math.round((productData.sell_price - productData.cost_price) / productData.sell_price * 100)}%
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
                                                        <p className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Profit / Unit</p>
                                                        <p className="text-2xl font-black font-mono text-foreground">
                                                            KES {(productData.sell_price - productData.cost_price).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                            {productData.sell_price && productData.sale_price && productData.sale_price > productData.sell_price && (
                                                <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
                                                    <p className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Discount</p>
                                                    <p className="text-2xl font-black font-mono text-amber-500">
                                                        {Math.round((productData.sale_price - productData.sell_price) / productData.sale_price * 100)}% off
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* ── INVENTORY ── */}
                            {activeTab === "inventory" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SKU</Label>
                                            <Input
                                                value={productData.sku || ""}
                                                onChange={(e) => set("sku", e.target.value)}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono uppercase"
                                                placeholder="e.g. TRV-APL-P16-512-BLK"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Barcode <span className="normal-case font-normal">(UPC/EAN/GTIN)</span></Label>
                                            <Input
                                                value={productData.barcode || ""}
                                                onChange={(e) => set("barcode", e.target.value)}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="e.g. 8806094914766"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stock Quantity</Label>
                                            <Input
                                                type="number"
                                                value={productData.stock_quantity ?? ""}
                                                onChange={(e) => set("stock_quantity", parseInt(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Threshold</Label>
                                            <Input
                                                type="number"
                                                value={productData.low_stock_threshold ?? ""}
                                                onChange={(e) => set("low_stock_threshold", parseInt(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="5"
                                                min="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.warehouse || "main"}
                                                onChange={(e) => set("warehouse", e.target.value)}
                                            >
                                                <option value="main">Main Warehouse</option>
                                                <option value="east">East Hub</option>
                                                <option value="west">West Hub</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Stock health indicator */}
                                    {productData.stock_quantity !== undefined && productData.stock_quantity !== null && (
                                        <div className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border text-sm font-medium",
                                            productData.stock_quantity === 0
                                                ? "bg-red-500/5 border-red-500/20 text-red-600"
                                                : productData.stock_quantity <= (productData.low_stock_threshold ?? 5)
                                                ? "bg-amber-500/5 border-amber-500/20 text-amber-600"
                                                : "bg-green-500/5 border-green-500/20 text-green-600"
                                        )}>
                                            {productData.stock_quantity === 0 ? (
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                            ) : productData.stock_quantity <= (productData.low_stock_threshold ?? 5) ? (
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 shrink-0" />
                                            )}
                                            <span>
                                                {productData.stock_quantity === 0
                                                    ? "Out of stock"
                                                    : productData.stock_quantity <= (productData.low_stock_threshold ?? 5)
                                                    ? `Low stock — ${productData.stock_quantity} units remaining (threshold: ${productData.low_stock_threshold ?? 5})`
                                                    : `Stock level healthy — ${productData.stock_quantity} units`
                                                }
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stock Status</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.stock_status || "instock"}
                                                onChange={(e) => set("stock_status", e.target.value as any)}
                                            >
                                                <option value="instock">In Stock</option>
                                                <option value="outofstock">Out of Stock</option>
                                                <option value="onbackorder">On Backorder</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Backorder Policy</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.allow_backorders || "no"}
                                                onChange={(e) => set("allow_backorders", e.target.value)}
                                            >
                                                <option value="no">Do not allow</option>
                                                <option value="notify">Allow — notify customer</option>
                                                <option value="yes">Allow indefinitely</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── VARIANTS ── */}
                            {activeTab === "variants" && (
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        Each row is a unique purchasable SKU. Color + Storage combinations generate separate inventory entries.
                                    </p>

                                    <div className="border border-border/40 rounded-xl overflow-hidden">
                                        {/* Header */}
                                        <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr_0.8fr_2rem] gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/30">
                                            {["Color", "Storage", "Price (KES)", "SKU", "Stock", ""].map(h => (
                                                <span key={h} className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-wider">{h}</span>
                                            ))}
                                        </div>
                                        {/* Rows */}
                                        {variants.map((v, idx) => (
                                            <div
                                                key={v.id}
                                                className={cn(
                                                    "grid grid-cols-[1fr_1fr_1fr_1.2fr_0.8fr_2rem] gap-2 px-4 py-2 border-b border-border/20 items-center",
                                                    idx % 2 === 1 && "bg-muted/20"
                                                )}
                                            >
                                                <input
                                                    value={v.color}
                                                    onChange={(e) => setVariants(rows => rows.map(r => r.id === v.id ? { ...r, color: e.target.value } : r))}
                                                    placeholder="e.g. Black"
                                                    className="border border-border/40 rounded-lg px-2.5 py-1.5 text-xs bg-background w-full outline-none focus:border-primary/50"
                                                />
                                                <input
                                                    value={v.storage}
                                                    onChange={(e) => setVariants(rows => rows.map(r => r.id === v.id ? { ...r, storage: e.target.value } : r))}
                                                    placeholder="e.g. 256GB"
                                                    className="border border-border/40 rounded-lg px-2.5 py-1.5 text-xs bg-background w-full outline-none focus:border-primary/50"
                                                />
                                                <input
                                                    type="number"
                                                    value={v.price_kes}
                                                    onChange={(e) => setVariants(rows => rows.map(r => r.id === v.id ? { ...r, price_kes: e.target.value } : r))}
                                                    placeholder="75000"
                                                    className="border border-border/40 rounded-lg px-2.5 py-1.5 text-xs bg-background w-full outline-none focus:border-primary/50 font-mono"
                                                />
                                                <input
                                                    value={v.sku}
                                                    onChange={(e) => setVariants(rows => rows.map(r => r.id === v.id ? { ...r, sku: e.target.value } : r))}
                                                    placeholder="SKU-BLK-256"
                                                    className="border border-border/40 rounded-lg px-2.5 py-1.5 text-xs bg-background w-full outline-none focus:border-primary/50 font-mono uppercase"
                                                />
                                                <input
                                                    type="number"
                                                    value={v.stock}
                                                    onChange={(e) => setVariants(rows => rows.map(r => r.id === v.id ? { ...r, stock: e.target.value } : r))}
                                                    placeholder="0"
                                                    className="border border-border/40 rounded-lg px-2.5 py-1.5 text-xs bg-background w-full outline-none focus:border-primary/50 font-mono"
                                                    min="0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setVariants(rows => rows.filter(r => r.id !== v.id))}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {/* Add row */}
                                        <div className="px-4 py-2">
                                            <button
                                                type="button"
                                                onClick={() => setVariants(rows => [...rows, { id: uid(), color: "", storage: "", price_kes: String(productData.sell_price || ""), sku: "", stock: "" }])}
                                                className="flex items-center gap-2 border border-dashed border-border/40 rounded-lg px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> Add variant row
                                            </button>
                                        </div>
                                    </div>
                                    {variants.length > 0 && (
                                        <p className="text-[10px] font-mono text-muted-foreground/50">
                                            {variants.length} variant{variants.length !== 1 ? "s" : ""} ·{" "}
                                            Total stock: {variants.reduce((a, v) => a + (parseInt(v.stock) || 0), 0)} units
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── SPECS ── */}
                            {activeTab === "specs" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={specsEnabled}
                                                onCheckedChange={setSpecsEnabled}
                                                id="specs-enabled"
                                            />
                                            <Label htmlFor="specs-enabled" className="text-sm font-medium cursor-pointer">
                                                Include specs accordion on PDP
                                            </Label>
                                        </div>
                                        {specsEnabled && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg text-xs"
                                                onClick={() => setSpecGroups(gs => [...gs, { id: uid(), label: "New Group", rows: [{ id: uid(), label: "", value: "" }] }])}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Group
                                            </Button>
                                        )}
                                    </div>

                                    {specsEnabled && (
                                        <div className="space-y-3">
                                            {specGroups.length === 0 && (
                                                <div className="border-2 border-dashed border-border/30 rounded-xl py-10 text-center text-muted-foreground/50 text-sm">
                                                    No spec groups yet. Click "Add Group" to start.
                                                </div>
                                            )}
                                            {specGroups.map((group) => (
                                                <div key={group.id} className="border border-border/40 rounded-xl overflow-hidden">
                                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/30">
                                                        <input
                                                            value={group.label}
                                                            onChange={(e) => setSpecGroups(gs => gs.map(g => g.id === group.id ? { ...g, label: e.target.value } : g))}
                                                            className="flex-1 border-none bg-transparent text-sm font-semibold outline-none"
                                                        />
                                                        <span className="text-[9px] font-mono text-muted-foreground/50">{group.rows.length} rows</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSpecGroups(gs => gs.filter(g => g.id !== group.id))}
                                                            className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="divide-y divide-border/20">
                                                        <div className="grid grid-cols-[1fr_1fr_1.5rem] gap-2 px-4 py-1.5 bg-muted/10">
                                                            {["Spec", "Value", ""].map(h => (
                                                                <span key={h} className="text-[9px] font-mono font-bold text-muted-foreground/50 uppercase">{h}</span>
                                                            ))}
                                                        </div>
                                                        {group.rows.map((row) => (
                                                            <div key={row.id} className="grid grid-cols-[1fr_1fr_1.5rem] gap-2 px-4 py-1.5 items-center">
                                                                <input
                                                                    value={row.label}
                                                                    onChange={(e) => setSpecGroups(gs => gs.map(g => g.id === group.id ? { ...g, rows: g.rows.map(r => r.id === row.id ? { ...r, label: e.target.value } : r) } : g))}
                                                                    placeholder="e.g. Screen Size"
                                                                    className="border border-border/30 rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary/50 w-full"
                                                                />
                                                                <input
                                                                    value={row.value}
                                                                    onChange={(e) => setSpecGroups(gs => gs.map(g => g.id === group.id ? { ...g, rows: g.rows.map(r => r.id === row.id ? { ...r, value: e.target.value } : r) } : g))}
                                                                    placeholder="e.g. 6.8 inches"
                                                                    className="border border-border/30 rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary/50 w-full"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSpecGroups(gs => gs.map(g => g.id === group.id ? { ...g, rows: g.rows.filter(r => r.id !== row.id) } : g))}
                                                                    className="w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div className="px-4 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSpecGroups(gs => gs.map(g => g.id === group.id ? { ...g, rows: [...g.rows, { id: uid(), label: "", value: "" }] } : g))}
                                                                className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
                                                            >
                                                                + Add row
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SHIPPING ── */}
                            {activeTab === "shipping" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weight <span className="normal-case font-normal">(grams)</span></Label>
                                            <Input
                                                type="number"
                                                value={productData.weight ?? ""}
                                                onChange={(e) => set("weight", parseFloat(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="e.g. 232"
                                                min="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shipping Class</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.shipping_class || "standard"}
                                                onChange={(e) => set("shipping_class", e.target.value)}
                                            >
                                                <option value="standard">Standard</option>
                                                <option value="express">Express</option>
                                                <option value="heavy">Heavy / Oversized</option>
                                                <option value="fragile">Fragile</option>
                                                <option value="free">Free Shipping</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package Dimensions (mm)</Label>
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            <Input
                                                type="number"
                                                value={productData.length ?? ""}
                                                onChange={(e) => set("length", parseFloat(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="Length"
                                                min="0"
                                            />
                                            <Input
                                                type="number"
                                                value={productData.width ?? ""}
                                                onChange={(e) => set("width", parseFloat(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="Width"
                                                min="0"
                                            />
                                            <Input
                                                type="number"
                                                value={productData.height ?? ""}
                                                onChange={(e) => set("height", parseFloat(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="Height"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country of Origin</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.country_of_origin || "cn"}
                                                onChange={(e) => set("country_of_origin", e.target.value)}
                                            >
                                                <option value="ke">Kenya</option>
                                                <option value="kr">South Korea</option>
                                                <option value="cn">China</option>
                                                <option value="us">United States</option>
                                                <option value="vn">Vietnam</option>
                                                <option value="in">India</option>
                                                <option value="tw">Taiwan</option>
                                                <option value="jp">Japan</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">HS Tariff Code <span className="normal-case font-normal">(customs)</span></Label>
                                            <Input
                                                value={productData.hs_code || ""}
                                                onChange={(e) => set("hs_code", e.target.value)}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="e.g. 8517.12.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Instructions <span className="normal-case font-normal">(internal)</span></Label>
                                        <Textarea
                                            value={productData.purchase_note || ""}
                                            onChange={(e) => set("purchase_note", e.target.value)}
                                            placeholder="Special handling, fragile items, packaging notes..."
                                            className="min-h-[100px] rounded-xl bg-background border-border/60"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── SEO ── */}
                            {activeTab === "seo" && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meta Title</Label>
                                            <span className={cn(
                                                "text-[10px] font-mono",
                                                (productData.seo_title?.length ?? 0) > 70 ? "text-red-500" : (productData.seo_title?.length ?? 0) > 60 ? "text-amber-500" : "text-muted-foreground/50"
                                            )}>
                                                {productData.seo_title?.length ?? 0} / 60
                                            </span>
                                        </div>
                                        <Input
                                            value={productData.seo_title || ""}
                                            onChange={(e) => set("seo_title", e.target.value)}
                                            className="h-12 rounded-xl bg-background border-border/60"
                                            placeholder={basicInfo.name ? `${basicInfo.name} | Trovestak` : "SEO title (50-60 chars)"}
                                        />
                                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    (productData.seo_title?.length ?? 0) > 70 ? "bg-red-500"
                                                    : (productData.seo_title?.length ?? 0) > 60 ? "bg-amber-500"
                                                    : "bg-green-500"
                                                )}
                                                style={{ width: `${Math.min(100, ((productData.seo_title?.length ?? 0) / 60) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meta Description</Label>
                                            <span className={cn(
                                                "text-[10px] font-mono",
                                                (productData.seo_description?.length ?? 0) > 160 ? "text-red-500" : (productData.seo_description?.length ?? 0) > 140 ? "text-amber-500" : "text-muted-foreground/50"
                                            )}>
                                                {productData.seo_description?.length ?? 0} / 160
                                            </span>
                                        </div>
                                        <Textarea
                                            value={productData.seo_description || ""}
                                            onChange={(e) => set("seo_description", e.target.value)}
                                            placeholder="Brief description for search results (max 160 chars)..."
                                            className="min-h-[100px] rounded-xl bg-background border-border/60"
                                        />
                                    </div>

                                    {/* Google Search Preview */}
                                    <div className="border border-border/40 rounded-xl p-5 bg-white dark:bg-[#0b0d17] space-y-1">
                                        <p className="text-[10px] font-mono font-bold text-muted-foreground/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Search className="w-3 h-3" /> Google Search Preview
                                        </p>
                                        <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-[18px] font-normal hover:underline cursor-default leading-snug">
                                            {productData.seo_title || basicInfo.name || "Product title"}
                                        </p>
                                        <p className="text-[#006621] dark:text-[#34a853] text-[13px]">
                                            trovestak.com › products › {basicInfo.slug || "product-slug"}
                                        </p>
                                        <p className="text-[#545454] dark:text-[#bdc1c6] text-[14px] leading-[1.58]">
                                            {productData.seo_description || "No meta description set. Add one above to control how this page appears in search results."}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Canonical URL <span className="normal-case font-normal">(leave empty for default)</span></Label>
                                        <Input
                                            value={productData.seo_canonical || ""}
                                            onChange={(e) => set("seo_canonical", e.target.value)}
                                            className="h-12 rounded-xl bg-background border-border/60 font-mono text-sm"
                                            placeholder="https://trovestak.com/products/..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── ORGANIZATION ── */}
                            {activeTab === "organization" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Brand</Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.brand || ""}
                                                onChange={(e) => set("brand", e.target.value)}
                                            >
                                                <option value="">Select brand...</option>
                                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nav Category <span className="normal-case font-normal">(chapter nav)</span></Label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
                                                value={productData.nav_category || ""}
                                                onChange={(e) => set("nav_category", e.target.value)}
                                            >
                                                <option value="">Select nav category...</option>
                                                {NAV_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tags <span className="normal-case font-normal">(press Enter or comma to add)</span></Label>
                                        <div className="border border-border/60 rounded-xl p-3 bg-background flex flex-wrap gap-2 min-h-[48px] focus-within:border-primary/50 transition-colors">
                                            {(productData.tags ?? []).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1.5 bg-muted border border-border/50 rounded-lg px-2.5 py-1 text-xs font-medium"
                                                >
                                                    #{tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => set("tags", (productData.tags ?? []).filter(t => t !== tag))}
                                                        className="text-muted-foreground/50 hover:text-foreground"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                                                        e.preventDefault();
                                                        const tag = tagInput.trim().replace(/,$/, "").toLowerCase();
                                                        if (!(productData.tags ?? []).includes(tag)) {
                                                            set("tags", [...(productData.tags ?? []), tag]);
                                                        }
                                                        setTagInput("");
                                                    }
                                                }}
                                                placeholder={(productData.tags?.length ?? 0) === 0 ? "android, flagship, 5g..." : ""}
                                                className="border-none outline-none bg-transparent text-sm flex-1 min-w-[120px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Featured</Label>
                                            <div className="flex items-center gap-3 h-12 border border-border/60 rounded-xl px-4 bg-background">
                                                <Switch
                                                    checked={productData.is_featured ?? false}
                                                    onCheckedChange={(v) => set("is_featured", v)}
                                                    id="is-featured"
                                                />
                                                <Label htmlFor="is-featured" className="text-sm font-medium cursor-pointer">Show in Featured section</Label>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort Order</Label>
                                            <Input
                                                type="number"
                                                value={productData.menu_order ?? ""}
                                                onChange={(e) => set("menu_order", parseInt(e.target.value))}
                                                className="h-12 rounded-xl bg-background border-border/60 font-mono"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── NAV FOOTER ── */}
                            <div className="flex items-center justify-between pt-6 border-t border-border/20">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl"
                                    disabled={tabIndex === 0}
                                    onClick={() => setActiveTab(TABS[tabIndex - 1].id)}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <span className="text-[10px] font-mono text-muted-foreground/40">
                                    {tabIndex + 1} / {TABS.length}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl"
                                    disabled={tabIndex === TABS.length - 1}
                                    onClick={() => setActiveTab(TABS[tabIndex + 1].id)}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Media Library Modal */}
            {showMediaLibrary && (
                <MediaLibrary
                    isOpen={!!showMediaLibrary}
                    onClose={() => setShowMediaLibrary(null)}
                    onSelect={(urls) => {
                        if (showMediaLibrary === "main" && urls.length > 0) {
                            set("thumbnail_url", urls[0]);
                        } else if (showMediaLibrary === "gallery") {
                            set("images", [...(productData.images || []), ...urls]);
                        }
                        setShowMediaLibrary(null);
                    }}
                    multiple={showMediaLibrary === "gallery"}
                    title={showMediaLibrary === "main" ? "Select Main Image" : "Add Gallery Images"}
                />
            )}
        </form>
    );
}
