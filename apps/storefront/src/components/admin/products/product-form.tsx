import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, ArrowLeft, AlertCircle, Info, Image as ImageIcon,
  DollarSign, Package, Layers, Settings, Truck, Search, Layout,
  X, ChevronRight, Globe, TrendingUp, ArrowUpRight, Plus, ExternalLink,
  ChevronDown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductById, upsertProduct } from "@/app/admin/products/actions";
import { cn } from "@/lib/utils";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { formatKES } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";

const brands = [
  "Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft",
  "Google", "OnePlus", "Xiaomi", "OPPO", "vivo", "Realme", "Infinix", "Tecno", "Nokia",
  "JBL", "Bose", "Beats", "Garmin", "Fitbit", "Amazfit", "DJI", "Canon", "Nikon",
  "PlayStation", "Xbox", "Nintendo", "Starlink", "TCL", "Hisense", "Vision Plus", "Other"
];

const TABS = [
  { id: "general",      label: "General",       icon: Info },
  { id: "media",        label: "Media",          icon: ImageIcon },
  { id: "pricing",      label: "Pricing",        icon: DollarSign },
  { id: "inventory",    label: "Inventory",      icon: Package },
  { id: "variants",     label: "Variants",       icon: Layers },
  { id: "specs",        label: "Specs",          icon: Settings },
  { id: "shipping",     label: "Shipping",       icon: Truck },
  { id: "seo",          label: "SEO",            icon: Search },
];

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isNew = !productId;

  const [activeTab, setActiveTab] = useState("general");
  const [existingProduct, setExistingProduct] = useState<any>(null);
  const [productLoading, setProductLoading] = useState(!!productId);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const [productData, setProductData] = useState<ProductData>({
    product_type: "simple",
    stock_status: "instock",
    low_stock_threshold: 5,
    is_active: true,
    visibility: "catalog",
  });

  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [subSubCategory, setSubSubCategory] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState<"main" | "gallery" | null>(null);

  const currentMegaMenu = mainCategory ? megaMenuData[mainCategory] : null;

  // Load existing product data when editing
  useEffect(() => {
    async function loadData() {
      if (!productId) return;

      setProductLoading(true);
      try {
        const { product, primaryCategoryId } = await getProductById(productId);
        if (product) {
          setExistingProduct(product);
          setBasicInfo({
            name: product.name || "",
            slug: product.slug || "",
            description: product.description || "",
          });

          setProductData({
            cost_price: product.cost_price,
            regular_price: product.regular_price,
            sell_price: product.sell_price,
            sale_price_start: product.sale_price_start,
            sale_price_end: product.sale_price_end,
            product_type: product.product_type || "simple",
            sku: product.sku,
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status || "instock",
            low_stock_threshold: product.low_stock_threshold || 5,
            brand: product.brand,
            tags: product.tags,
            thumbnail_url: product.thumbnail_url,
            images: product.images,
            is_featured: product.is_featured,
            visibility: product.visibility || "catalog",
            purchase_note: product.purchase_note,
            menu_order: product.menu_order,
            is_active: product.is_active,
          });

          if (primaryCategoryId) {
            setMainCategory(primaryCategoryId);
          }
        }
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setProductLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleProductDataChange = (data: Partial<ProductData>) => {
    setProductData(prev => ({ ...prev, ...data }));
  };

  const onSubmit = async (e: React.FormEvent) => {
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
      const slug = basicInfo.slug || basicInfo.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const categorySlug = subSubCategory || subCategory || mainCategory;

      const payload = {
        name: basicInfo.name,
        slug,
        description: basicInfo.description,
        ...productData,
      };

      const result = await upsertProduct(productId || null, payload, categorySlug);

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
      <div className="flex items-center justify-between pb-6 border-b border-border/40">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all">
            <Link href="/admin/products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h2 className="text-3xl font-black font-dm-sans tracking-tightest">
              {isNew ? "Assemble Masterpiece" : "Refinement Studio"}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
               {isNew ? "Blueprint for a new luxury essential" : `Editing: ${basicInfo.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {saveSuccess && (
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-green-500 text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full"
              >
                Sync Complete
              </motion.span>
            )}
          </AnimatePresence>
          <Button 
            type="submit" 
            disabled={saving}
            className="h-12 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
            {saving ? "Deploying..." : isNew ? "Create Product" : "Commit Changes"}
          </Button>
        </div>
      </div>

      {saveError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest"
        >
          <AlertCircle className="w-5 h-5" />
          {saveError}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-2 sticky top-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all group",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                  : "text-muted-foreground/40 hover:text-foreground hover:bg-surface border border-transparent hover:border-border"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "opacity-100" : "opacity-40 group-hover:opacity-100")} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-h-[600px] glass-card rounded-[2.5rem] border-border/40 p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
             <Layout className="w-64 h-64 rotate-12" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-12"
            >
              {activeTab === "general" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Identity & Essence</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Define the core soul and positioning of your product.</p>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Product Name</Label>
                      <Input
                        value={basicInfo.name}
                        onChange={(e) => {
                           const name = e.target.value;
                           const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                           setBasicInfo({ ...basicInfo, name, slug });
                        }}
                        placeholder="e.g. Master & Dynamic MH40"
                        className="h-14 rounded-2xl bg-surface border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium px-6"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Permanent Slug</Label>
                        <Input
                          value={basicInfo.slug}
                          onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value })}
                          placeholder="master-dynamic-mh40"
                          className="h-14 rounded-2xl bg-surface border-border/60 font-mono text-sm px-6"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Visibility Status</Label>
                        <select
                          className="flex h-14 w-full rounded-2xl border border-border/60 bg-surface px-6 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                          value={productData.visibility}
                          onChange={(e) => handleProductDataChange({ visibility: e.target.value as any })}
                        >
                          <option value="catalog">Visible in Catalog</option>
                          <option value="hidden">Hidden from World</option>
                          <option value="search">Search Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Aesthetic Narrative (Description)</Label>
                      <Textarea
                        value={basicInfo.description}
                        onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                        placeholder="Craft a compelling story about why this product belongs in a premium lifestyle..."
                        className="min-h-[200px] rounded-[2rem] bg-surface border-border/60 p-8 text-base leading-relaxed focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>

                    <div className="pt-8 border-t border-border/20 space-y-8">
                       <div className="space-y-2">
                        <h4 className="text-lg font-black font-dm-sans tracking-tight">Taxonomy & Lineage</h4>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Organize within the Trove Ecosystem</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Main Category</Label>
                          <select
                            className="flex h-12 w-full rounded-xl border border-border/40 bg-surface/50 px-4 text-xs font-bold outline-none"
                            value={mainCategory}
                            onChange={(e) => {
                              setMainCategory(e.target.value);
                              setSubCategory("");
                              setSubSubCategory("");
                            }}
                          >
                            <option value="">Select Domain...</option>
                            {mainCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        {currentMegaMenu && (
                           <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Subcategory</Label>
                            <select
                              className="flex h-12 w-full rounded-xl border border-border/40 bg-surface/50 px-4 text-xs font-bold outline-none"
                              value={subCategory}
                              onChange={(e) => {
                                setSubCategory(e.target.value);
                                setSubSubCategory("");
                              }}
                            >
                              <option value="">Select Sub-domain...</option>
                              {currentMegaMenu.columns.map((col) => (
                                <option key={col.title} value={col.title}>{col.title}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {currentMegaMenu && subCategory && (
                           <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Artisan Segment</Label>
                            <select
                              className="flex h-12 w-full rounded-xl border border-border/40 bg-surface/50 px-4 text-xs font-bold outline-none"
                              value={subSubCategory}
                              onChange={(e) => setSubSubCategory(e.target.value)}
                            >
                              <option value="">Select Segment...</option>
                              {currentMegaMenu.columns
                                .find(col => col.title === subCategory)
                                ?.items.map((item) => (
                                  <option key={item.category} value={item.category}>{item.category}</option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Visual Assets</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">High-fidelity imagery for the premium experience.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {/* Main Image Card */}
                       <div className="col-span-1 lg:col-span-2 space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Signature View (Main)</Label>
                          <div 
                            onClick={() => setShowMediaLibrary("main")}
                            className="aspect-video rounded-[2rem] border-2 border-dashed border-border/40 bg-surface/50 hover:bg-surface hover:border-primary/40 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4 overflow-hidden relative"
                          >
                            {productData.thumbnail_url ? (
                              <>
                                <img src={productData.thumbnail_url} alt="Main" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Button type="button" variant="secondary" className="rounded-full font-black text-[9px] uppercase tracking-widest px-6 h-10">Replace Image</Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform">
                                   <ImageIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Select Signature Asset</span>
                              </>
                            )}
                          </div>
                       </div>

                       {/* Gallery Summary / Quick Add */}
                       <div className="col-span-1 lg:col-span-2 space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Supporting Perspectives (Gallery)</Label>
                          <div 
                            onClick={() => setShowMediaLibrary("gallery")}
                            className="aspect-video rounded-[2rem] border-2 border-dashed border-border/40 bg-surface/50 hover:bg-surface hover:border-primary/40 transition-all cursor-pointer group flex items-center justify-center gap-6 overflow-hidden relative"
                          >
                            {productData.images && productData.images.length > 0 ? (
                               <div className="grid grid-cols-2 gap-3 w-full h-full p-4">
                                  {productData.images.slice(0, 4).map((url, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border border-border/20 bg-white relative">
                                       <img src={url} alt="" className="w-full h-full object-cover" />
                                       {i === 3 && productData.images!.length > 4 && (
                                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-sm">
                                            +{productData.images!.length - 4}
                                         </div>
                                       )}
                                    </div>
                                  ))}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                                     <Button type="button" variant="secondary" className="rounded-full font-black text-[9px] uppercase tracking-widest px-6 h-10">Manage Gallery</Button>
                                  </div>
                               </div>
                            ) : (
                               <>
                                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform">
                                    <Layers className="w-6 h-6" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Populate Gallery</span>
                               </>
                            )}
                          </div>
                       </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <AlertCircle className="w-6 h-6" />
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-amber-700 uppercase tracking-widest">Asset Protocols</h4>
                          <p className="text-xs text-amber-600/80 leading-relaxed font-medium">Use high-resolution WebP or PNG with transparent backgrounds for maximum aesthetic impact. Recommended dimensions: 2000x2000px.</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Value & Strategy</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Establish the premium positioning and financial structure.</p>
                  </div>

                  <div className="grid gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Retail Appreciation (Sell Price)</Label>
                          <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground/40 group-focus-within:text-primary transition-colors">KES</span>
                            <Input
                              type="number"
                              value={productData.sell_price || ""}
                              onChange={(e) => handleProductDataChange({ sell_price: parseFloat(e.target.value) })}
                              className="h-14 px-16 rounded-2xl bg-surface border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-lg font-black font-mono"
                              placeholder="0.00"
                            />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Anchor Point (Regular Price)</Label>
                          <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground/40 group-focus-within:text-primary transition-colors">KES</span>
                            <Input
                              type="number"
                              value={productData.regular_price || ""}
                              onChange={(e) => handleProductDataChange({ regular_price: parseFloat(e.target.value) })}
                              className="h-14 px-16 rounded-2xl bg-surface border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-lg font-black font-mono opacity-60"
                              placeholder="0.00"
                            />
                            <Info className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Acquisition Cost</Label>
                          <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground/40 group-focus-within:text-primary transition-colors">KES</span>
                            <Input
                              type="number"
                              value={productData.cost_price || ""}
                              onChange={(e) => handleProductDataChange({ cost_price: parseFloat(e.target.value) })}
                              className="h-14 px-16 rounded-2xl bg-surface border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-lg font-black font-mono opacity-60"
                              placeholder="0.00"
                            />
                          </div>
                       </div>
                       
                       {productData.sell_price && productData.cost_price && (
                         <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Projected Margin</p>
                               <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black font-dm-sans text-primary">
                                    {Math.round(((productData.sell_price - productData.cost_price) / productData.sell_price) * 100)}%
                                  </span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Profit per unit</p>
                               <p className="text-xl font-black text-foreground">KES {(productData.sell_price - productData.cost_price).toLocaleString()}</p>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Stock & Logistics</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Manage the physical availability and tracking of your assets.</p>
                  </div>

                  <div className="grid gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Universal SKU</Label>
                          <Input
                            value={productData.sku || ""}
                            onChange={(e) => handleProductDataChange({ sku: e.target.value })}
                            className="h-14 rounded-2xl bg-surface border-border/60 font-mono text-sm px-6 uppercase"
                            placeholder="e.g. TRV-APL-P16-512-BLK"
                          />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Current Allocation (Stock)</Label>
                          <Input
                            type="number"
                            value={productData.stock_quantity || ""}
                            onChange={(e) => handleProductDataChange({ stock_quantity: parseInt(e.target.value) })}
                            className="h-14 rounded-2xl bg-surface border-border/60 text-lg font-black px-6"
                            placeholder="0"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Stock Status</Label>
                          <select
                            className="flex h-14 w-full rounded-2xl border border-border/60 bg-surface px-6 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            value={productData.stock_status}
                            onChange={(e) => handleProductDataChange({ stock_status: e.target.value as any })}
                          >
                            <option value="instock">Fully Provisioned (In Stock)</option>
                            <option value="outofstock">Exhausted (Out of Stock)</option>
                            <option value="onbackorder">Reserved (On Backorder)</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Depletion Threshold</Label>
                          <Input
                            type="number"
                            value={productData.low_stock_threshold || ""}
                            onChange={(e) => handleProductDataChange({ low_stock_threshold: parseInt(e.target.value) })}
                            className="h-14 rounded-2xl bg-surface border-border/60 font-medium px-6"
                            placeholder="5"
                          />
                       </div>
                    </div>
                  </div>
                </div>
              )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Backorder Protocol</Label>
                          <select
                            className="flex h-14 w-full rounded-2xl border border-border/60 bg-surface px-6 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            value={productData.allow_backorders || "no"}
                            onChange={(e) => handleProductDataChange({ allow_backorders: e.target.value })}
                          >
                            <option value="no">Do not allow</option>
                            <option value="notify">Allow, but notify customer</option>
                            <option value="yes">Allow indefinitely</option>
                          </select>
                       </div>
                       <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                             <Info className="w-5 h-5" />
                          </div>
                          <p className="text-[11px] leading-relaxed text-primary/80 font-medium">
                             Backorders allow customers to purchase items even when stock levels are zero. Ensure your fulfillment pipeline is ready.
                          </p>
                       </div>
                    </div>

              {activeTab === "variants" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Dimensionality</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Define the multiple forms and configurations this product takes.</p>
                  </div>

                  <div className="space-y-8">
                     <div className="p-8 rounded-[2.5rem] bg-surface border border-border/40 space-y-6">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Configuration Engine</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {["simple", "variable", "grouped", "external"].map((type) => (
                             <button
                               key={type}
                               type="button"
                               onClick={() => handleProductDataChange({ product_type: type as any })}
                               className={cn(
                                 "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all uppercase tracking-widest text-[9px] font-black",
                                 productData.product_type === type 
                                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                                  : "bg-surface/50 border-border/60 text-muted-foreground/40 hover:border-primary/40 hover:text-foreground"
                               )}
                             >
                               {type === "simple" && <Package className="w-5 h-5" />}
                               {type === "variable" && <Layers className="w-5 h-5" />}
                               {type === "grouped" && <Layout className="w-5 h-5" />}
                               {type === "external" && <Truck className="w-5 h-5" />}
                               {type}
                             </button>
                           ))}
                        </div>
                     </div>

                     {productData.product_type === "variable" ? (
                       <div className="p-12 border-2 border-dashed border-border/40 rounded-[2.5rem] text-center space-y-6">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary/20 mx-auto">
                             <Layers className="w-8 h-8" />
                          </div>
                          <div className="space-y-2">
                             <h4 className="text-lg font-black font-dm-sans tracking-tight">Variant Matrix Active</h4>
                             <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto font-medium">Configure individual attributes like Color, Storage, and Size to spawn unique variant SKUs.</p>
                          </div>
                          <Button variant="secondary" className="rounded-full font-black text-[9px] uppercase tracking-widest px-8">Define Attributes</Button>
                       </div>
                     ) : (
                       <div className="p-8 rounded-2xl bg-muted/30 border border-border/20 text-xs text-center text-muted-foreground/60 font-medium">
                          Variants are disabled for {productData.product_type} products. Switch to Variable to enable.
                       </div>
                     )}
                  </div>
                </div>
              )}

              {activeTab === "specs" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Technical Pedigree</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Granular specifications and lineage markers.</p>
                  </div>

                  <div className="grid gap-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">House of Origin (Brand)</Label>
                           <select
                              className="flex h-14 w-full rounded-2xl border border-border/60 bg-surface px-6 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                              value={productData.brand || ""}
                              onChange={(e) => handleProductDataChange({ brand: e.target.value })}
                            >
                              <option value="">Select House...</option>
                              {brands.map((brand) => (
                                <option key={brand} value={brand}>{brand}</option>
                              ))}
                              <option value="Other">Other Artisan...</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Ecosystem Tags</Label>
                           <Input
                             placeholder="new-arrival, limited-edition, archive"
                             value={productData.tags?.join(", ") || ""}
                             onChange={(e) => handleProductDataChange({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                             className="h-14 rounded-2xl bg-surface border-border/60 font-medium px-6"
                           />
                        </div>
                     </div>

                     <div className="p-12 border-2 border-dashed border-border/40 rounded-[2.5rem] text-center space-y-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary/20 mx-auto">
                           <Settings className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-lg font-black font-dm-sans tracking-tight">Structured Specifications</h4>
                           <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto font-medium">Add technical groups like "Display", "Battery", or "Materials" to build the spec table.</p>
                        </div>
                        <Button variant="outline" className="rounded-full font-black text-[9px] uppercase tracking-widest px-8">Initialize Spec Group</Button>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Transit & Arrival</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Configure the physical logistics and delivery parameters.</p>
                  </div>

                  <div className="grid gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Net Mass (Weight)</Label>
                          <div className="relative group">
                            <Input
                              type="number"
                              className="h-14 pr-16 rounded-2xl bg-surface border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium px-6"
                              placeholder="0"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Grams</span>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Shipping Class</Label>
                          <select
                            className="flex h-14 w-full rounded-2xl border border-border/60 bg-surface px-6 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                          >
                            <option value="standard">Standard Logistics</option>
                            <option value="express">Priority Express</option>
                            <option value="heavy">Heavy Handling</option>
                            <option value="digital">No Physical Transit (Digital)</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Delivery Protocols (Internal Note)</Label>
                       <Textarea
                          value={productData.purchase_note || ""}
                          onChange={(e) => handleProductDataChange({ purchase_note: e.target.value })}
                          placeholder="Special instructions for shipping partners or delivery team..."
                          className="min-h-[120px] rounded-[2rem] bg-surface border-border/60 p-6 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                       />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-dm-sans tracking-tightest">Archive Visibility (SEO)</h3>
                    <p className="text-xs font-medium text-muted-foreground/60">Optimize the digital footprint for global search indices.</p>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Curation Title (Meta Title)</Label>
                      <Input
                        placeholder="Search engine optimized name..."
                        className="h-14 rounded-2xl bg-surface border-border/60 font-medium px-6 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Synoptic Summary (Meta Description)</Label>
                      <Textarea
                        placeholder="Brief overview for search snippets..."
                        className="min-h-[140px] rounded-[2rem] bg-surface border-border/60 p-6 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                      <div className="flex justify-end pr-4">
                         <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">0 / 160 Characters</span>
                      </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
                       <div className="flex items-center gap-4 text-primary">
                          <Search className="w-5 h-5" />
                          <h4 className="text-xs font-black uppercase tracking-widest">SERP Preview</h4>
                       </div>
                       <div className="space-y-1.5 pl-9">
                          <div className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
                            {basicInfo.name || "Untitled Product"} | Trove Platforms
                          </div>
                          <div className="text-green-700 text-[11px] font-medium lowercase">
                             trovestak.com/products/{basicInfo.slug || "url-slug"}
                          </div>
                          <div className="text-muted-foreground/60 text-xs line-clamp-2 leading-relaxed">
                             {basicInfo.description || "Enter a description to see its preview in search results. A well-crafted description improves click-through rates."}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {showMediaLibrary && (
        <MediaLibrary
          isOpen={!!showMediaLibrary}
          onClose={() => setShowMediaLibrary(null)}
          onSelect={(urls) => {
            if (showMediaLibrary === "main" && urls.length > 0) {
              handleProductDataChange({ thumbnail_url: urls[0] });
            } else if (showMediaLibrary === "gallery") {
              handleProductDataChange({ images: [...(productData.images || []), ...urls] });
            }
            setShowMediaLibrary(null);
          }}
          multiple={showMediaLibrary === "gallery"}
          title={showMediaLibrary === "main" ? "Select Master Asset" : "Assemble Gallery"}
        />
      )}
    </form>
  );
}
