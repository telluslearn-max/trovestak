"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  ChevronRight,
  Package,
  Image as ImageIcon,
  DollarSign,
  Truck,
  Hash,
  Search,
  Layers,
  FileText,
  Activity,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateProductFull,
  updateProductPricing,
  updateProductSpecs
} from "@/app/admin/products/[id]/enhanced-actions";

// Shared Primitives
import { SectionHead } from "./products/editor-layout";

// Tab Components
import { TabGeneral, TabSEO } from "./products/tabs-general-seo";
import { TabPricing, TabInventory, TabShipping } from "./products/tabs-pricing-logistics";
import { TabVariants, TabSpecs } from "./products/tabs-variants-specs";
import { TabMedia } from "./products/tab-media";
import { TabOrganization } from "./products/tab-organization";
import { MediaLibrary } from "@/components/admin/media/media-library";

interface ProductWithDetails {
  product: any;
  pricing: any;
  variants: any; // Can be array or the old object
  specs: any;
  content: any;
  addons: any[];
}

interface EnhancedProductEditorProps {
  productData: ProductWithDetails;
}

const TABS = [
  { id: "general", label: "General", icon: <Package className="w-4 h-4" /> },
  { id: "media", label: "Media", icon: <ImageIcon className="w-4 h-4" /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign className="w-4 h-4" /> },
  { id: "inventory", label: "Inventory", icon: <Hash className="w-4 h-4" /> },
  { id: "variants", label: "Variants", icon: <Layers className="w-4 h-4" /> },
  { id: "specs", label: "Specs", icon: <Activity className="w-4 h-4" /> },
  { id: "shipping", label: "Shipping", icon: <Truck className="w-4 h-4" /> },
  { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" /> },
  { id: "organization", label: "Organization", icon: <FileText className="w-4 h-4" /> },
];

import { useTheme } from "@/components/admin/theme-wrapper";

export function EnhancedProductEditor({ productData }: EnhancedProductEditorProps) {
  const { theme } = useTheme();
  const { product, pricing, variants, specs, content } = productData;

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showMediaLibrary, setShowMediaLibrary] = useState<"main" | "gallery" | null>(null);

  // Theme colors - matching BestStore Pro
  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "#030712" : "#f8fafc",
    cardBg: isDark ? "#111827" : "#ffffff",
    cardBorder: isDark ? "#1f2937" : "#e2e8f0",
    text: isDark ? "#f9fafb" : "#0f172a",
    textMuted: isDark ? "#6b7280" : "#64748b",
    accent: "#3b82f6",
    navBg: isDark ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.8)",
  };

  // States
  const [form, setForm] = useState({
    ...product,
    name: product?.name ?? "",
    short_name: product?.short_name ?? "",
    subtitle: product?.subtitle ?? "",
    description: product?.description ?? "",
    slug: product?.slug ?? "",
    seo_title: product?.seo_title ?? "",
    seo_description: product?.seo_description ?? "",
    brand_type: product?.brand_type ?? "",
    collection: product?.collection ?? "",
    nav_category: product?.nav_category ?? "",
    nav_subcategory: product?.nav_subcategory ?? "",
    sku: product?.sku ?? "",
    stock_quantity: product?.stock_quantity ?? 0,
    is_active: product?.is_active ?? true,
    tags: product?.tags ?? "",
  });

  const [priceForm, setPriceForm] = useState({
    cost_price: pricing?.cost_price || 0,
    sell_price: pricing?.sell_price || 0,
    discount_percent: pricing?.discount_percent || 0,
    compare_price: pricing?.compare_price || 0,
  });

  const [imagesForm, setImagesForm] = useState({
    thumbnail_url: product?.thumbnail_url || "",
    gallery_urls: product?.gallery_urls || [],
  });

  const [variantTypes, setVariantTypes] = useState<any[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [specsData, setSpecsData] = useState<Record<string, Record<string, string>>>(specs || {});
  const [shippingForm, setShippingForm] = useState({
    weight: product?.weight || 0,
    length: product?.length || 0,
    width: product?.width || 0,
    height: product?.height || 0,
    shipping_class: product?.shipping_class || "standard",
  });

  // Initialization logic for variants
  useEffect(() => {
    if (Array.isArray(variants)) {
      setGeneratedVariants(variants.map(v => ({
        ...v,
        price: v.price_kes ? v.price_kes / 100 : v.price || 0,
        stock: v.stock_quantity || v.stock || 0
      })));
    }
  }, [variants]);

  // Global Save Handler
  const handleSave = async (status: "active" | "draft") => {
    setSaving(true);
    try {
      const payload = {
        product: {
          ...form,
          ...shippingForm,
          ...imagesForm,
          is_active: status === "active"
        },
        pricing: priceForm,
        specs: specsData,
        variants: generatedVariants,
        content: {
          ...content,
          overview: form.description
        }
      };

      await updateProductFull(product.id, payload);
      toast.success(`Product ${status === "active" ? "published" : "saved as draft"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .glass-nav { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .tab-btn:hover { background: ${isDark ? "#1f2937" : "#f1f5f9"}; color: ${colors.text}; }
        pre::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Sticky Top Bar */}
      <div className="glass-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: colors.navBg, borderBottom: `1px solid ${colors.cardBorder}`,
        height: 64, paddingLeft: "24px", paddingRight: "24px", display: "flex", alignItems: "center", gap: 16,
        padding: "0 24px"
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link href="/admin/products" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 10, background: isDark ? "#1f2937" : "#fff",
            border: `1px solid ${colors.cardBorder}`, color: colors.text, textDecoration: "none",
            transition: "all 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = colors.cardBorder}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted }}>
            <span style={{ cursor: "pointer" }} onClick={() => window.location.href = '/admin/products'}>Products</span>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: colors.text, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.name || "Untitled Product"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 14px", background: isDark ? "#1e293b" : "#f1f5f9",
            borderRadius: 20, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: form.is_active ? "#10b981" : "#f59e0b" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {form.is_active ? "Live" : "Draft"}
            </span>
          </div>

          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            style={{
              padding: "9px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`,
              background: "transparent", color: colors.text, fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? "#1f2937" : "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Save Draft
          </button>

          <button
            onClick={() => handleSave("active")}
            disabled={saving}
            style={{
              padding: "9px 24px", borderRadius: 10, border: "none",
              background: colors.accent, color: "#fff", fontSize: 12, fontWeight: 800,
              cursor: "pointer", boxShadow: `0 4px 12px ${colors.accent}40`,
              transition: "transform 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >
            {saving ? "Publishing..." : "Publish Item"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 32px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* Left Navigation */}
        <aside style={{ position: "sticky", top: 104, alignSelf: "start" }}>
          <div style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: 20, padding: 8, display: "flex", flexDirection: "column", gap: 4,
            boxShadow: `0 4px 20px -1px ${isDark ? "#00000050" : "#00000008"}`
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tab-btn"
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 14, border: "none",
                  background: activeTab === tab.id ? colors.accent : "transparent",
                  color: activeTab === tab.id ? "#fff" : colors.textMuted,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ opacity: activeTab === tab.id ? 1 : 0.7 }}>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
                )}
              </button>
            ))}
          </div>

          {/* JSON Live Preview */}
          <div style={{
            marginTop: 24, padding: 20, background: isDark ? "#0f172a" : "#1e293b",
            borderRadius: 20, border: `1px solid ${isDark ? "#1e293b" : "#334155"}`,
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace" }}>JSON PREVIEW</span>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              </div>
            </div>
            <pre style={{
              margin: 0, fontSize: 10, color: "#cbd5e1", background: "transparent",
              fontFamily: "'DM Mono', monospace", lineHeight: 1.6, overflowX: "auto"
            }}>
              {JSON.stringify({
                id: product.id.slice(0, 8),
                name: form.name,
                price: priceForm.sell_price,
                stock: form.stock_quantity,
                active: form.is_active
              }, null, 2)}
            </pre>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{
          background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 24, padding: "48px 56px",
          boxShadow: `0 4px 20px -1px ${isDark ? "#00000050" : "#00000008"}`,
          minHeight: 800
        }}>
          {activeTab === "general" && <TabGeneral form={form} setForm={setForm} />}
          {activeTab === "media" && (
            <TabMedia
              imagesForm={imagesForm}
              setImagesForm={setImagesForm}
              onOpenLibrary={setShowMediaLibrary}
            />
          )}
          {activeTab === "pricing" && <TabPricing priceForm={priceForm} setPriceForm={setPriceForm} />}
          {activeTab === "inventory" && <TabInventory form={form} setForm={setForm} />}
          {activeTab === "variants" && (
            <TabVariants
              variantTypes={variantTypes}
              setVariantTypes={setVariantTypes}
              generatedVariants={generatedVariants}
              setGeneratedVariants={setGeneratedVariants}
            />
          )}
          {activeTab === "specs" && <TabSpecs specsData={specsData} setSpecsData={setSpecsData} />}
          {activeTab === "shipping" && <TabShipping shippingForm={shippingForm} setShippingForm={setShippingForm} />}
          {activeTab === "seo" && <TabSEO form={form} setForm={setForm} />}
          {activeTab === "organization" && <TabOrganization form={form} setForm={setForm} />}
        </main>
      </div>

      {/* Global Media Library Overlay */}
      {showMediaLibrary && (
        <MediaLibrary
          isOpen={!!showMediaLibrary}
          onClose={() => setShowMediaLibrary(null)}
          onSelect={(assets: any[]) => {
            const urls = assets.map(a => a.url);
            if (showMediaLibrary === "main") {
              setImagesForm({ ...imagesForm, thumbnail_url: urls[0] });
            } else {
              setImagesForm(prev => ({ ...prev, gallery_urls: [...prev.gallery_urls, ...urls] }));
            }
            setShowMediaLibrary(null);
          }}
          multiple={showMediaLibrary === "gallery"}
        />
      )}
    </div>
  );
}
