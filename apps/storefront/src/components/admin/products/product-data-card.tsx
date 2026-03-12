"use client";

import { useState, useEffect } from "react";
import {
  Settings, Package, Tag, Link2, Layers, Star,
  ChevronDown, ChevronRight, DollarSign, CheckCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { searchProductsAdmin } from "@/app/admin/products/actions";

export interface ProductData {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  cost_price?: number;
  regular_price?: number;
  sell_price?: number;
  sale_price_start?: string;
  sale_price_end?: string;
  product_type?: string;
  sku?: string;
  stock_quantity?: number;
  stock_status?: string;
  low_stock_threshold?: number;
  allow_backorders?: string;
  brand?: string;
  tags?: string[];
  thumbnail_url?: string;
  images?: string[];
  is_featured?: boolean;
  visibility?: string;
  purchase_note?: string;
  menu_order?: number;
  is_active?: boolean;
  attributes?: { name: string; value: string }[];
  upsell_ids?: string[];
}

interface ProductDataCardProps {
  product: ProductData;
  onChange: (data: Partial<ProductData>) => void;
}

type TabId = "general" | "inventory" | "linked" | "attributes" | "advanced";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
  { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },
  { id: "linked", label: "Linked Products", icon: <Link2 className="w-4 h-4" /> },
  { id: "attributes", label: "Attributes", icon: <Layers className="w-4 h-4" /> },
  { id: "advanced", label: "Advanced", icon: <Star className="w-4 h-4" /> },
];

export function ProductDataCard({ product, onChange }: ProductDataCardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex">
        {/* Vertical Tab Navigation - WooCommerce Style */}
        <nav className="w-48 flex-shrink-0 border-r bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-r transition-colors text-left ${activeTab === tab.id
                  ? "bg-white border-r-0 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 p-6">
          {activeTab === "general" && (
            <GeneralTab product={product} onChange={onChange} />
          )}
          {activeTab === "inventory" && (
            <InventoryTab product={product} onChange={onChange} />
          )}
          {activeTab === "linked" && (
            <LinkedProductsTab product={product} onChange={onChange} />
          )}
          {activeTab === "attributes" && (
            <AttributesTab product={product} onChange={onChange} />
          )}
          {activeTab === "advanced" && (
            <AdvancedTab product={product} onChange={onChange} />
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== GENERAL TAB ====================
function GeneralTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>Product Type</Label>
        <select
          value={product.product_type || "simple"}
          onChange={(e) => onChange({ product_type: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="simple">Simple product</option>
          <option value="grouped">Grouped product</option>
          <option value="variable">Variable product</option>
        </select>
        <p className="text-xs text-gray-500">
          {product.product_type === "simple" && "A simple product is a physical product with a single price."}
          {product.product_type === "grouped" && "A grouped product is a collection of related simple products."}
          {product.product_type === "variable" && "A variable product has multiple variations with different prices."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Cost Price (KES)</Label>
          <Input
            type="number"
            value={product.cost_price || ""}
            onChange={(e) => onChange({ cost_price: Number(e.target.value) || undefined })}
            placeholder="0"
          />
          <p className="text-xs text-gray-500">Your cost for profit calculation</p>
        </div>

        <div className="grid gap-2">
          <Label>Regular Price (KES)</Label>
          <Input
            type="number"
            value={product.regular_price || ""}
            onChange={(e) => onChange({ regular_price: Number(e.target.value) || undefined })}
            placeholder="0"
          />
          <p className="text-xs text-gray-500">Original price before sale</p>
        </div>

        <div className="grid gap-2">
          <Label>Sell Price (KES)</Label>
          <Input
            type="number"
            value={product.sell_price || ""}
            onChange={(e) => onChange({ sell_price: Number(e.target.value) || undefined })}
            placeholder="0"
          />
          <p className="text-xs text-gray-500">Current selling price</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => { }}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          Schedule sale price ▼
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Sale price start date</Label>
            <Input
              type="date"
              value={product.sale_price_start || ""}
              onChange={(e) => onChange({ sale_price_start: e.target.value || undefined })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Sale price end date</Label>
            <Input
              type="date"
              value={product.sale_price_end || ""}
              onChange={(e) => onChange({ sale_price_end: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== INVENTORY TAB ====================
function InventoryTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>SKU</Label>
        <Input
          value={product.sku || ""}
          onChange={(e) => onChange({ sku: e.target.value })}
          placeholder="e.g. PROD-001"
        />
        <p className="text-xs text-gray-500">Stock Keeping Unit (optional)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Stock quantity</Label>
          <Input
            type="number"
            value={product.stock_quantity ?? ""}
            onChange={(e) => onChange({ stock_quantity: Number(e.target.value) || undefined })}
            placeholder="0"
          />
        </div>

        <div className="grid gap-2">
          <Label>Low stock threshold</Label>
          <Input
            type="number"
            value={product.low_stock_threshold ?? 5}
            onChange={(e) => onChange({ low_stock_threshold: Number(e.target.value) || 5 })}
            placeholder="5"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Stock status</Label>
        <select
          value={product.stock_status || "instock"}
          onChange={(e) => onChange({ stock_status: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="instock">In stock</option>
          <option value="outofstock">Out of stock</option>
          <option value="onbackorder">On backorder</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label>Allow backorders</Label>
        <select
          value={product.allow_backorders || "no"}
          onChange={(e) => onChange({ allow_backorders: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="no">Do not allow</option>
          <option value="notify">Allow, but notify customer</option>
          <option value="yes">Allow</option>
        </select>
      </div>
    </div>
  );
}

// ==================== CATEGORIES TAB ====================
function CategoriesTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  return <p className="text-gray-500">Use the Categories section in the sidebar to assign products to categories.</p>;
}

// ==================== BRAND & TAGS TAB ====================
const brands = [
  "Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft",
  "Google", "OnePlus", "Xiaomi", "OPPO", "vivo", "Realme", "Infinix", "Tecno", "Nokia",
  "JBL", "Bose", "Beats", "Garmin", "Fitbit", "Amazfit", "DJI", "Canon", "Nikon",
  "PlayStation", "Xbox", "Nintendo", "Starlink", "TCL", "Hisense", "Vision Plus", "Other"
];

function BrandTagsTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  const [customBrand, setCustomBrand] = useState("");

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>Brand</Label>
        <select
          value={product.brand || ""}
          onChange={(e) => {
            if (e.target.value === "Other") {
              onChange({ brand: customBrand || "Other" });
            } else {
              onChange({ brand: e.target.value });
            }
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select brand...</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {product.brand === "Other" && (
        <div className="grid gap-2">
          <Label>Custom Brand Name</Label>
          <Input
            value={customBrand}
            onChange={(e) => {
              setCustomBrand(e.target.value);
              onChange({ brand: e.target.value });
            }}
            placeholder="Enter brand name"
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label>Tags</Label>
        <Input
          value={product.tags?.join(", ") || ""}
          onChange={(e) => onChange({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
          placeholder="e.g. new-arrival, best-seller, sale"
        />
        <p className="text-xs text-gray-500">Separate tags with commas</p>
      </div>
    </div>
  );
}

// ==================== IMAGES TAB ====================
function ImagesTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>Main Image</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          {product.thumbnail_url ? (
            <div className="relative inline-block">
              <img src={product.thumbnail_url} alt="Main" className="max-h-48 rounded-lg" />
              <button
                type="button"
                onClick={() => onChange({ thumbnail_url: "" })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMediaLibrary(true)}
              className="cursor-pointer"
            >
              <p className="text-sm text-gray-500">Click to select main image</p>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Gallery Images</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setShowMediaLibrary(true)}
            className="w-full cursor-pointer"
          >
            <p className="text-sm text-gray-500">Click to add gallery images</p>
          </button>

          {product.images && product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {product.images.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => onChange({ images: product.images?.filter((_, i) => i !== index) })}
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

      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(urls) => {
          if (!product.thumbnail_url && urls.length > 0) {
            onChange({ thumbnail_url: urls[0] });
            if (urls.length > 1) {
              onChange({ images: [...(product.images || []), ...urls.slice(1)] });
            }
          } else {
            onChange({ images: [...(product.images || []), ...urls] });
          }
          setShowMediaLibrary(false);
        }}
        multiple
        title="Select Images"
      />
    </div>
  );
}

// ==================== LINKED PRODUCTS TAB ====================
function LinkedProductsTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchProducts = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await searchProductsAdmin(query);
      setSearchResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Upsells</Label>
        <p className="text-xs text-gray-500 mb-2">Products that promote higher-priced versions of this product</p>

        <div className="space-y-2">
          <Input
            placeholder="Search products to add as upsell..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchProducts(e.target.value);
            }}
          />

          {searchResults.length > 0 && (
            <div className="border rounded-lg max-h-40 overflow-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const currentUpsells = product.upsell_ids || [];
                    if (!currentUpsells.includes(p.id)) {
                      onChange({ upsell_ids: [...currentUpsells, p.id] });
                    }
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="w-8 h-8 object-cover rounded" />}
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>Cross-sells</Label>
        <p className="text-xs text-gray-500 mb-2">Products shown in cart as related items</p>
        <Input placeholder="Search products to add as cross-sell..." />
      </div>
    </div>
  );
}

// ==================== ATTRIBUTES TAB ====================
function AttributesTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  const [attributes, setAttributes] = useState<{ name: string; value: string }[]>(
    product.attributes || []
  );

  const addAttribute = () => {
    const newAttrs = [...attributes, { name: "", value: "" }];
    setAttributes(newAttrs);
    onChange({ attributes: newAttrs });
  };

  const updateAttribute = (index: number, field: "name" | "value", value: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = value;
    setAttributes(newAttrs);
    onChange({ attributes: newAttrs });
  };

  const removeAttribute = (index: number) => {
    const newAttrs = attributes.filter((_, i) => i !== index);
    setAttributes(newAttrs);
    onChange({ attributes: newAttrs });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Name (e.g. Color)"
              value={attr.name}
              onChange={(e) => updateAttribute(index, "name", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value (e.g. Red)"
              value={attr.value}
              onChange={(e) => updateAttribute(index, "value", e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeAttribute(index)}
              className="px-3 text-red-500 hover:bg-red-50 rounded"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addAttribute}
        className="text-sm text-blue-600 hover:underline"
      >
        + Add attribute
      </button>
    </div>
  );
}

// ==================== ADVANCED TAB ====================
function AdvancedTab({ product, onChange }: { product: ProductData; onChange: (data: Partial<ProductData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>Visibility</Label>
        <select
          value={product.visibility || "catalog"}
          onChange={(e) => onChange({ visibility: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="catalog">Shop and search</option>
          <option value="search">Search only</option>
          <option value="hidden">Hidden</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_featured"
          checked={product.is_featured || false}
          onChange={(e) => onChange({ is_featured: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="is_featured">This is a featured product</Label>
      </div>

      <div className="grid gap-2">
        <Label>Purchase note</Label>
        <Input
          value={product.purchase_note || ""}
          onChange={(e) => onChange({ purchase_note: e.target.value })}
          placeholder="Optional note to send to customer after purchase"
        />
      </div>

      <div className="grid gap-2">
        <Label>Menu order</Label>
        <Input
          type="number"
          value={product.menu_order ?? 0}
          onChange={(e) => onChange({ menu_order: Number(e.target.value) || 0 })}
          placeholder="0"
        />
        <p className="text-xs text-gray-500">Sorting order in catalogs</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={product.is_active ?? true}
          onChange={(e) => onChange({ is_active: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="is_active">Product is active</Label>
      </div>
    </div>
  );
}

export default ProductDataCard;
