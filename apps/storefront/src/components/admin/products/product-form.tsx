"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductById, upsertProduct } from "@/app/admin/products/actions";
import { getCategories } from "@/app/admin/actions";
import { megaMenuData, mainCategories } from "@/lib/megamenu";
import { ProductDataCard, ProductData } from "./product-data-card";
import { MediaLibrary } from "@/components/admin/media/media-library";

const brands = [
  "Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft",
  "Google", "OnePlus", "Xiaomi", "OPPO", "vivo", "Realme", "Infinix", "Tecno", "Nokia",
  "JBL", "Bose", "Beats", "Garmin", "Fitbit", "Amazfit", "DJI", "Canon", "Nikon",
  "PlayStation", "Xbox", "Nintendo", "Starlink", "TCL", "Hisense", "Vision Plus", "Other"
];

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isNew = !productId;

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
            // Simplified for now, just set the category slug if it exists in megamenu
            // In a real scenario, we'd resolve the full path on the server
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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">
            {isNew ? "Add Product" : "Edit Product"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  placeholder="Product name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={basicInfo.slug}
                  onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value })}
                  placeholder="auto-generated"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  placeholder="Product description"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Data Card - WooCommerce Style */}
          <ProductDataCard
            product={productData}
            onChange={handleProductDataChange}
          />
        </div>

        <div className="space-y-6">
          {/* Categories Sidebar */}
          <Card>
            <CardHeader><CardTitle>Category</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Main Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={mainCategory}
                  onChange={(e) => {
                    setMainCategory(e.target.value);
                    setSubCategory("");
                    setSubSubCategory("");
                  }}
                >
                  <option value="">Select main category...</option>
                  {mainCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {currentMegaMenu && (
                <div className="grid gap-2">
                  <Label>Subcategory</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={subCategory}
                    onChange={(e) => {
                      setSubCategory(e.target.value);
                      setSubSubCategory("");
                    }}
                  >
                    <option value="">Select subcategory...</option>
                    {currentMegaMenu.columns.map((col) => (
                      <option key={col.title} value={col.title}>{col.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {currentMegaMenu && subCategory && (
                <div className="grid gap-2">
                  <Label>Sub-subcategory</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={subSubCategory}
                    onChange={(e) => setSubSubCategory(e.target.value)}
                  >
                    <option value="">Select sub-subcategory...</option>
                    {currentMegaMenu.columns
                      .find(col => col.title === subCategory)
                      ?.items.map((item) => (
                        <option key={item.category} value={item.category}>{item.category}</option>
                      ))}
                  </select>
                </div>
              )}

              {(mainCategory || subCategory || subSubCategory) && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Selected:</p>
                  <p className="text-sm text-muted-foreground">
                    {mainCategory && <span className="capitalize">{mainCategory}</span>}
                    {subCategory && <> → <span>{subCategory}</span></>}
                    {subSubCategory && <> → <span>{subSubCategory}</span></>}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brand & Tags Sidebar */}
          <Card>
            <CardHeader><CardTitle>Brand & Tags</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Brand</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={productData.brand || ""}
                  onChange={(e) => handleProductDataChange({ brand: e.target.value })}
                >
                  <option value="">Select brand...</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {productData.brand === "Other" && (
                <div className="grid gap-2">
                  <Label>Custom Brand</Label>
                  <Input
                    placeholder="Enter brand name"
                    value={productData.brand || ""}
                    onChange={(e) => handleProductDataChange({ brand: e.target.value })}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Tags</Label>
                <Input
                  placeholder="e.g. new-arrival, best-seller"
                  value={productData.tags?.join(", ") || ""}
                  onChange={(e) => handleProductDataChange({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images Sidebar */}
          <Card>
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Main Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {productData.thumbnail_url ? (
                    <div className="relative inline-block">
                      <img src={productData.thumbnail_url} alt="Main" className="max-h-32 rounded-lg" />
                      <button
                        type="button"
                        onClick={() => handleProductDataChange({ thumbnail_url: "" })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMediaLibrary("main")}
                      className="cursor-pointer"
                    >
                      <p className="text-sm text-gray-500">Click to select image</p>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Gallery</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <button
                    type="button"
                    onClick={() => setShowMediaLibrary("gallery")}
                    className="w-full cursor-pointer"
                  >
                    <p className="text-sm text-gray-500">Click to add gallery</p>
                  </button>

                  {productData.images && productData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {productData.images.map((url, index) => (
                        <div key={index} className="relative">
                          <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-16 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => handleProductDataChange({ images: productData.images?.filter((_, i) => i !== index) })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
            title={showMediaLibrary === "main" ? "Select Main Image" : "Select Gallery Images"}
          />
        )}
      </div>
    </form>
  );
}
