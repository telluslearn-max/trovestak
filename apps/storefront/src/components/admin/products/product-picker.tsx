"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatKES } from "@/lib/formatters";
import type { Product } from "@/types/product";

interface ProductPickerProps {
  mode: "single" | "multiple";
  selectedIds?: string[];
  onSelect: (products: Product[]) => void;
  trigger?: React.ReactNode;
}

export function ProductPicker({ mode, selectedIds = [], onSelect, trigger }: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  // Fetch products on search
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("id, name, slug, thumbnail_url, regular_price, sale_price, stock_status")
        .eq("status", "published")
        .eq("is_active", true)
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data } = await query.limit(50);
      setProducts(data || []);
      setLoading(false);
    }

    if (open) {
      fetchProducts();
    }
  }, [open, search]);

  // Handle selection
  const handleToggle = (productId: string) => {
    const newSet = new Set(selected);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      if (mode === "single") {
        newSet.clear();
      }
      newSet.add(productId);
    }
    setSelected(newSet);
  };

  // Confirm selection
  const handleConfirm = () => {
    const selectedProducts = products.filter(p => selected.has(p.id));
    onSelect(selectedProducts);
    setOpen(false);
    setSearch("");
  };

  // Format price
  const formatPrice = (price: number | undefined) => {
    if (!price) return "—";
    return formatKES(price / 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" type="button">
            Select Products
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "single" ? "Select Product" : "Select Products"}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selected.size} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="text-[#86868B]"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Product list */}
        <div className="max-h-[400px] overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#86868B]" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-[#86868B]">
              No products found
            </div>
          ) : (
            <div className="divide-y">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleToggle(product.id)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[#F5F5F7] transition-colors ${selected.has(product.id) ? "bg-[#0071E3]/5" : ""
                    }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected.has(product.id)
                      ? "bg-[#0071E3] border-[#0071E3]"
                      : "border-[#E5E5E7]"
                    }`}>
                    {selected.has(product.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="w-10 h-10 rounded bg-[#F5F5F7] overflow-hidden flex-shrink-0">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-[#1D1D1F] line-clamp-1">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#86868B]">
                      {formatPrice(product.sale_price || product.regular_price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {mode === "single" ? "Select" : `Add ${selected.size} Products`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
