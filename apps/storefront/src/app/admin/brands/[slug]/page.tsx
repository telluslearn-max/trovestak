"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Package,
    ExternalLink,
    Loader2,
    Info,
    Search,
    Globe,
    Building2,
    Award,
    Check,
    X,
    ChevronDown,
    Save
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    getBrandDetail,
    bulkUpdateProductBrand
} from "../actions";
import { useTheme } from "@/components/admin/theme-wrapper";
import { toast } from "sonner";
import Image from "next/image";

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { theme } = useTheme();

    const [brand, setBrand] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [brandsList, setBrandsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showReview, setShowReview] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isMoving, setIsMoving] = useState(false);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [targetBrandSlug, setTargetBrandSlug] = useState("");

    const isDark = theme === "dark";
    const colors = {
        bg: isDark ? "#030712" : "#f8fafc",
        cardBg: isDark ? "#111827" : "#ffffff",
        cardBorder: isDark ? "#1f2937" : "#e2e8f0",
        text: isDark ? "#f9fafb" : "#0f172a",
        textMuted: isDark ? "#6b7280" : "#64748b",
        accent: "#3b82f6",
        activeBg: isDark ? "#1f2937" : "#f1f5f9",
    };

    const BRAND_MAPPING: Record<string, string> = {
        'JBL': 'jbl', 'Tune': 'jbl', 'Wave': 'jbl', 'Live': 'jbl', 'Tour': 'jbl', 'Partybox': 'jbl', 'Go ': 'jbl',
        'Charge': 'jbl', 'Flip': 'jbl', 'Clip': 'jbl', 'Xtreme': 'jbl', 'Boombox': 'jbl', 'Soundgear': 'jbl',
        'Samsung': 'samsung', 'Galaxy': 'samsung', 'Buds': 'samsung',
        'Apple': 'apple', 'iPhone': 'apple', 'iPad': 'apple', 'MacBook': 'apple', 'AirPods': 'apple',
        'Sony': 'sony', 'PlayStation': 'sony', 'PS5': 'sony', 'WH-1000': 'sony', 'WF-1000': 'sony',
        'DJI': 'dji', 'Osmo': 'dji', 'Pocket': 'dji', 'Mavic': 'dji', 'Rs3': 'dji', 'Rs4': 'dji', 'Mini 4': 'dji',
        'Marshall': 'marshall', 'Stanmore': 'marshall', 'Woburn': 'marshall', 'Major': 'marshall', 'Minor': 'marshall',
        'Harman': 'harman-kardon', 'Aura': 'harman-kardon', 'Onyx': 'harman-kardon',
        'Insta360': 'insta360', 'GoPro': 'gopro', 'Hero 13': 'gopro', 'Fujifilm': 'fujifilm', 'Instax': 'fujifilm',
        'Nintendo': 'nintendo', 'Switch': 'nintendo', 'Meta': 'meta', 'Quest': 'meta',
        'Beats': 'beats', 'Studio Pro': 'beats', 'Solo 4': 'beats', 'Canon': 'canon', 'EOS': 'canon',
        'Kodak': 'kodak', 'SHOKZ': 'shokz', 'OpenRun': 'shokz', 'Hollyland': 'hollyland', 'Lark': 'hollyland',
        'Remarkable': 'remarkable', 'Whoop': 'whoop', 'CMF': 'cmf', 'BlendJet': 'blendjet', 'Denon': 'denon',
        'Rayban': 'rayban', 'Bose': 'bose', 'QuietComfort': 'bose', 'Xboom': 'lg',
        'Zhiyun': 'zhiyun', 'Smooth': 'zhiyun'
    };

    useEffect(() => {
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getBrandDetail(slug);
            setBrand(data.brand);
            setProducts(data.products);
            setBrandsList(data.brandsList);
        } catch (err: any) {
            console.error("Error loading brand detail:", err);
            toast.error("Resource not found or access denied");
            router.push("/admin/brands");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSuggestions = async () => {
        if (products.length === 0) return;
        setIsCategorizing(true);
        const newSuggestions: any[] = [];

        try {
            for (const product of products) {
                let matchedBrand = "";
                for (const [pattern, bSlug] of Object.entries(BRAND_MAPPING)) {
                    if (product.name.toLowerCase().includes(pattern.toLowerCase())) {
                        matchedBrand = bSlug;
                        break;
                    }
                }

                if (matchedBrand) {
                    newSuggestions.push({
                        ...product,
                        suggested_slug: matchedBrand,
                        selected: true
                    });
                }
            }

            if (newSuggestions.length === 0) {
                toast.info("Analysis complete. No brand patterns detected in current titles.");
            } else {
                setSuggestions(newSuggestions);
                setShowReview(true);
            }
        } catch (err) {
            toast.error("Analysis interrupted");
        } finally {
            setIsCategorizing(false);
        }
    };

    const handleApplyCategorization = async () => {
        const toUpdate = suggestions.filter(s => s.selected);
        if (toUpdate.length === 0) return;

        setIsCategorizing(true);
        try {
            // Group by target slug for efficiency (though our bulk action is simple)
            const slugGroups: Record<string, string[]> = {};
            toUpdate.forEach(item => {
                if (!slugGroups[item.suggested_slug]) slugGroups[item.suggested_slug] = [];
                slugGroups[item.suggested_slug].push(item.id);
            });

            for (const [targetSlug, ids] of Object.entries(slugGroups)) {
                await bulkUpdateProductBrand(ids, targetSlug);
            }

            toast.success(`Successfully categorized ${toUpdate.length} products.`);
            setSuggestions([]);
            setShowReview(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to commit changes");
        } finally {
            setIsCategorizing(false);
        }
    };

    const updateSuggestionSlug = (id: string, newSlug: string) => {
        setSuggestions(prev => prev.map(s =>
            s.id === id ? { ...s, suggested_slug: newSlug } : s
        ));
    };

    const toggleProductSelection = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const next = new Set(selectedProductIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedProductIds(next);
    };

    const handleBulkMove = async () => {
        if (selectedProductIds.size === 0 || !targetBrandSlug) return;
        setIsMoving(true);
        try {
            const ids = Array.from(selectedProductIds);
            await bulkUpdateProductBrand(ids, targetBrandSlug);
            toast.success(`Successfully moved ${ids.length} products to ${brandsList.find(b => b.slug === targetBrandSlug)?.name}`);
            setSelectedProductIds(new Set());
            setShowMoveDialog(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to move products");
        } finally {
            setIsMoving(false);
        }
    };


    const toggleSuggestion = (id: string) => {
        setSuggestions(prev => prev.map(s =>
            s.id === id ? { ...s, selected: !s.selected } : s
        ));
    };

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto opacity-20" />
                    <p style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: colors.textMuted }}>Synchronizing brand data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: colors.bg, padding: "40px 24px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* Header Navigation */}
                <button
                    onClick={() => router.push("/admin/brands")}
                    style={{
                        display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
                        color: colors.textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 32,
                        transition: "color 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = colors.text}
                    onMouseLeave={e => e.currentTarget.style.color = colors.textMuted}
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Registry
                </button>

                {/* Brand Identity Hero */}
                <div style={{
                    background: colors.cardBg, borderRadius: 32, border: `1px solid ${colors.cardBorder}`,
                    padding: 40, marginBottom: 40, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.1)",
                    display: "flex", alignItems: "flex-start", gap: 40, flexWrap: "wrap"
                }}>
                    <div style={{
                        width: 120, height: 120, borderRadius: 28, background: colors.activeBg,
                        border: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 48, fontWeight: 900, color: colors.accent,
                        overflow: "hidden", position: "relative"
                    }}>
                        {brand?.logo_url ? (
                            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                <Image
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    style={{ objectFit: "contain", padding: 16 }}
                                />
                            </div>
                        ) : brand?.name.charAt(0)}
                    </div>

                    <div style={{ flex: 1, minWidth: 300 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: colors.text, letterSpacing: "-0.04em" }}>{brand?.name}</h1>
                            {brand?.is_virtual && <Badge variant="outline" style={{ background: colors.accent + "10", color: colors.accent, border: "none", fontWeight: 900, fontSize: 10, padding: "4px 10px" }}>SYSTEM VIRTUAL</Badge>}
                        </div>
                        <p style={{ margin: 0, fontSize: 16, color: colors.textMuted, maxWidth: 600, lineHeight: 1.6 }}>{brand?.description || "Manufacturer profile pending detailed specification."}</p>

                        {!brand?.is_virtual && (
                            <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: colors.textMuted }}>
                                    <Globe className="w-4 h-4" /> {brand?.country || "Global"}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: colors.textMuted }}>
                                    <Building2 className="w-4 h-4" /> Founded {brand?.founded || "N/A"}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: colors.textMuted }}>
                                    <Award className="w-4 h-4" /> {slug}
                                </div>
                            </div>
                        )}
                    </div>

                    {brand?.slug === "uncategorized" && products.length > 0 && (
                        <button
                            onClick={handleGenerateSuggestions}
                            disabled={isCategorizing || showReview}
                            style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "16px 28px",
                                borderRadius: 16, border: "none", background: "#10b981",
                                color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                                boxShadow: "0 10px 30px -10px rgba(16, 185, 129, 0.4)", transition: "all 0.2s"
                            }}
                        >
                            {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Info className="w-5 h-5" />}
                            {isCategorizing ? "Analyzing Titles..." : "Start Smart Analysis"}
                        </button>
                    )}
                </div>

                {/* Sub-Registry Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: colors.text, letterSpacing: "-0.02em" }}>Catalog Assets</h2>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.textMuted }}>{products.length} products linked to this manufacturer</p>
                    </div>

                    <div style={{ position: "relative", width: 300 }}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Locate within catalog..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 16px 12px 48px", borderRadius: 14,
                                border: `1px solid ${colors.cardBorder}`, background: colors.cardBg,
                                color: colors.text, fontSize: 14, fontWeight: 600, outline: "none"
                            }}
                        />
                    </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div style={{
                        background: colors.cardBg, borderRadius: 32, border: `1px dashed ${colors.cardBorder}`,
                        padding: "80px 0", textAlign: "center"
                    }}>
                        <Package className="w-16 h-16 opacity-10 mx-auto mb-6" />
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>No Assets Found</h3>
                        <p style={{ fontSize: 14, color: colors.textMuted, maxWidth: 300, margin: "8px auto" }}>This portfolio sub-section is currently empty or filtered out.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
                        {filteredProducts.map(p => (
                            <div key={p.id}
                                onClick={() => window.open(`/admin/products/${p.id}`, "_blank")}
                                style={{
                                    borderRadius: 24, border: `1px solid ${colors.cardBorder}`,
                                    background: colors.cardBg,
                                    overflow: "hidden",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-6px)";
                                    e.currentTarget.style.borderColor = colors.accent;
                                    e.currentTarget.style.boxShadow = `0 20px 25px -5px ${colors.accent}20`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.borderColor = colors.cardBorder;
                                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02)";
                                }}
                            >
                                <div style={{
                                    aspectRatio: "1/1", position: "relative", background: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    {/* Selection Checkbox */}
                                    {slug === "uncategorized" && (
                                        <div
                                            onClick={(e) => toggleProductSelection(p.id, e)}
                                            style={{
                                                position: "absolute", top: 12, left: 12, zIndex: 10,
                                                width: 24, height: 24, borderRadius: 8,
                                                background: selectedProductIds.has(p.id) ? colors.accent : "rgba(255,255,255,0.8)",
                                                border: `2px solid ${selectedProductIds.has(p.id) ? colors.accent : "#e2e8f0"}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)", transition: "all 0.2s"
                                            }}
                                        >
                                            {selectedProductIds.has(p.id) && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    )}

                                    {p.thumbnail_url ? (
                                        <Image src={p.thumbnail_url} alt={p.name} fill style={{ objectFit: "contain", padding: 16 }} />
                                    ) : (
                                        <Package className="w-10 h-10 opacity-10" />
                                    )}
                                    {!p.is_active && (
                                        <div style={{ position: "absolute", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Badge variant="outline" style={{ background: "#fff", color: "#000", border: "none", fontWeight: 900 }}>DRAFT</Badge>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: 20 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.text, lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", height: 40, lineHeight: 1.4 }}>{p.name}</div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, fontFamily: "'DM Mono', monospace", background: colors.activeBg, padding: "4px 8px", borderRadius: 6 }}>{p.slug}</div>
                                        <div style={{ color: colors.accent }}>
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Interactive Categorization Review Overlay */}
                {showReview && (
                    <div style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100,
                        display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 40
                    }}>
                        <div style={{
                            background: colors.cardBg, borderRadius: 32, width: "100%", maxWidth: 1000,
                            maxHeight: "90vh", overflow: "hidden", border: `1px solid ${colors.cardBorder}`,
                            display: "flex", flexDirection: "column", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.5)"
                        }}>
                            <div style={{ padding: "32px 40px", borderBottom: `1px solid ${colors.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: colors.text }}>Pipeline Preview & Correction</h2>
                                    <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>Review and adjust the engine's findings before applying to catalog</p>
                                </div>
                                <button onClick={() => setShowReview(false)} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: 8, opacity: 0.5 }}><X className="w-6 h-6" /></button>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px" }}>
                                <div style={{ display: "grid", gap: 16 }}>
                                    {suggestions.map(s => (
                                        <div key={s.id} style={{
                                            padding: 20, borderRadius: 20, background: colors.activeBg,
                                            display: "flex", alignItems: "center", gap: 24,
                                            border: s.selected ? `1px solid ${colors.accent}` : `1px solid transparent`,
                                            opacity: s.selected ? 1 : 0.5
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={s.selected}
                                                onChange={() => toggleSuggestion(s.id)}
                                                style={{ width: 20, height: 20, accentColor: colors.accent, cursor: "pointer" }}
                                            />

                                            <div style={{ width: 50, height: 50, borderRadius: 10, background: "#fff", padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {s.thumbnail_url ? (
                                                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                                        <Image
                                                            src={s.thumbnail_url}
                                                            alt={s.title || ""}
                                                            fill
                                                            sizes="64px"
                                                            style={{ objectFit: "contain" }}
                                                        />
                                                    </div>
                                                ) : <Package className="w-6 h-6 text-gray-300" />}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: colors.text, lineClamp: 1, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, overflow: "hidden" }}>{s.name}</div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, marginTop: 4 }}>ID: {s.id.slice(0, 8)}...</div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: colors.textMuted, textTransform: "uppercase" }}>Target Brand:</div>
                                                <div style={{ position: "relative" }}>
                                                    <select
                                                        value={s.suggested_slug}
                                                        onChange={(e) => updateSuggestionSlug(s.id, e.target.value)}
                                                        style={{
                                                            appearance: "none", background: colors.cardBg, color: colors.text,
                                                            border: `1px solid ${colors.cardBorder}`, borderRadius: 10,
                                                            padding: "8px 32px 8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none"
                                                        }}
                                                    >
                                                        {brandsList.map(b => (
                                                            <option key={b.slug} value={b.slug}>{b.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: "32px 40px", borderTop: `1px solid ${colors.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: isDark ? "#ffffff03" : "#f8fafc" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted }}>
                                    <span style={{ color: colors.accent, fontWeight: 900 }}>{suggestions.filter(s => s.selected).length}</span> items selected for update
                                </div>
                                <div style={{ display: "flex", gap: 16 }}>
                                    <button
                                        onClick={() => setShowReview(false)}
                                        style={{ padding: "12px 24px", borderRadius: 14, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                                    >Cancel</button>
                                    <button
                                        onClick={handleApplyCategorization}
                                        disabled={isCategorizing || suggestions.filter(s => s.selected).length === 0}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8, padding: "12px 32px", borderRadius: 14, border: "none",
                                            background: colors.accent, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
                                            boxShadow: `0 10px 20px -5px ${colors.accent}60`
                                        }}
                                    >
                                        {isCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isCategorizing ? "Syncing..." : "Confirm & Apply Batch"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Actions Floating Bar */}
                {selectedProductIds.size > 0 && (
                    <div style={{
                        position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
                        background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 24,
                        padding: "16px 32px", display: "flex", alignItems: "center", gap: 32,
                        boxShadow: "0 20px 50px -10px rgba(0,0,0,0.3)", zIndex: 110,
                        animation: "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.accent, boxShadow: `0 0 10px ${colors.accent}` }} />
                            <span style={{ fontSize: 14, fontWeight: 900, color: colors.text }}>{selectedProductIds.size} <span style={{ color: colors.textMuted, fontWeight: 700 }}>Items Selected</span></span>
                        </div>
                        <div style={{ width: 1, height: 24, background: colors.cardBorder }} />
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={() => setShowMoveDialog(true)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                                    borderRadius: 12, border: "none", background: colors.accent,
                                    color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer"
                                }}
                            >
                                <ExternalLink className="w-4 h-4" /> Move to Brand
                            </button>
                            <button
                                onClick={() => setSelectedProductIds(new Set())}
                                style={{
                                    padding: "10px 20px", borderRadius: 12, border: `1.5px solid ${colors.cardBorder}`,
                                    background: "transparent", color: colors.textMuted, fontSize: 13, fontWeight: 800, cursor: "pointer"
                                }}
                            >Cancel Selection</button>
                        </div>
                    </div>
                )}

                {/* Move to Brand Dialog */}
                {showMoveDialog && (
                    <div style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 120,
                        display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
                    }}>
                        <div style={{
                            background: colors.cardBg, borderRadius: 24, width: "100%", maxWidth: 450,
                            padding: 32, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 30px 60px -12px rgba(0,0,0,0.4)"
                        }}>
                            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: colors.text }}>Transition Identity</h3>
                            <p style={{ margin: "0 0 24px", fontSize: 14, color: colors.textMuted }}>Select the target brand for <span style={{ color: colors.text, fontWeight: 800 }}>{selectedProductIds.size}</span> portfolio assets.</p>

                            <div style={{ position: "relative", marginBottom: 32 }}>
                                <select
                                    value={targetBrandSlug}
                                    onChange={(e) => setTargetBrandSlug(e.target.value)}
                                    style={{
                                        width: "100%", appearance: "none", background: colors.activeBg, color: colors.text,
                                        border: `1px solid ${colors.cardBorder}`, borderRadius: 14,
                                        padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", outline: "none"
                                    }}
                                >
                                    <option value="">Select Target Brand...</option>
                                    {brandsList.map(b => (
                                        <option key={b.slug} value={b.slug}>{b.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    onClick={() => setShowMoveDialog(false)}
                                    style={{ flex: 1, padding: "14px", borderRadius: 14, border: `1.5px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 14, fontWeight: 800, cursor: "pointer" }}
                                >Cancel</button>
                                <button
                                    onClick={handleBulkMove}
                                    disabled={!targetBrandSlug || isMoving}
                                    style={{
                                        flex: 2, padding: "14px", borderRadius: 14, border: "none",
                                        background: colors.accent, color: "#fff", fontSize: 14, fontWeight: 900,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        boxShadow: `0 10px 20px -5px ${colors.accent}60`
                                    }}
                                >
                                    {isMoving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit Move"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
