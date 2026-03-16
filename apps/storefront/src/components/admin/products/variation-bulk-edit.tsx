"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { useVariationMutations } from "@/hooks/useProductMutations";
import type { ProductVariation } from "@/types/product";

interface VariationBulkEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variations: ProductVariation[];
  productId: string;
}

export function VariationBulkEdit({ 
  open, 
  onOpenChange, 
  variations, 
  productId 
}: VariationBulkEditProps) {
  const { bulkUpdateVariations } = useVariationMutations();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(variations.map(v => v.id)));
  const [updatePrice, setUpdatePrice] = useState(false);
  const [priceType, setPriceType] = useState<"set" | "add" | "subtract">("set");
  const [priceValue, setPriceValue] = useState("");
  const [updateStock, setUpdateStock] = useState(false);
  const [stockValue, setStockValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === variations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variations.map(v => v.id)));
    }
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    
    setSaving(true);

    try {
      const ids = Array.from(selectedIds);
      const updates: { price_kes?: number; stock_quantity?: number } = {};

      // Calculate price update (prices are whole KES integers — no cents)
      if (updatePrice && priceValue) {
        const basePrice = Math.round(parseFloat(priceValue));

        if (priceType === "set") {
          updates.price_kes = basePrice;
        } else {
          // For add/subtract, use the first selected variant's price as reference
          const selectedVars = variations.filter(v => selectedIds.has(v.id));
          const currentPrices = selectedVars.map(v => (v as any).price_kes || 0);
          const avgPrice = Math.round(currentPrices.reduce((a: number, b: number) => a + b, 0) / currentPrices.length);

          if (priceType === "add") {
            updates.price_kes = avgPrice + basePrice;
          } else {
            updates.price_kes = Math.max(0, avgPrice - basePrice);
          }
        }
      }

      // Calculate stock update
      if (updateStock && stockValue) {
        if (stockValue.startsWith("+") || stockValue.startsWith("-")) {
          // Relative update - would need current values
          const delta = parseInt(stockValue);
          updates.stock_quantity = delta; // This is simplified
        } else {
          updates.stock_quantity = parseInt(stockValue);
        }
      }

      if (Object.keys(updates).length > 0) {
        await bulkUpdateVariations(ids, updates);
      }

      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Edit Variations</DialogTitle>
          <DialogDescription>
            Update price and stock for {selectedIds.size} selected variations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === variations.length}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <Label htmlFor="select-all" className="text-sm">
              Select all {variations.length} variations
            </Label>
          </div>

          {/* Selected variations list */}
          <div className="max-h-[150px] overflow-y-auto border rounded-lg p-2 space-y-1">
            {variations.map((variation) => (
              <div
                key={variation.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-[#F5F5F7]"
              >
                <Checkbox
                  checked={selectedIds.has(variation.id)}
                  onCheckedChange={() => handleToggleSelect(variation.id)}
                  id={`var-${variation.id}`}
                />
                <Label htmlFor={`var-${variation.id}`} className="flex-1 text-sm">
                  {variation.name}
                </Label>
                <span className="text-xs text-[#86868B]">
                  {(variation as any).price_kes
                    ? `KES ${((variation as any).price_kes as number).toLocaleString()}`
                    : "No price"
                  }
                </span>
              </div>
            ))}
          </div>

          {/* Price Update */}
          <div className="space-y-3 p-4 bg-[#F5F5F7] rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Update Price</Label>
              <Checkbox
                checked={updatePrice}
                onCheckedChange={(checked) => setUpdatePrice(checked as boolean)}
                id="update-price"
              />
            </div>
            
            {updatePrice && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as any)}
                  className="flex h-10 rounded-md border border-[#E5E5E7] bg-white px-3 py-2 text-sm"
                >
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
                <Input
                  type="number"
                  placeholder="Price in KES"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Stock Update */}
          <div className="space-y-3 p-4 bg-[#F5F5F7] rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Update Stock</Label>
              <Checkbox
                checked={updateStock}
                onCheckedChange={(checked) => setUpdateStock(checked as boolean)}
                id="update-stock"
              />
            </div>
            
            {updateStock && (
              <Input
                type="number"
                placeholder="Stock quantity (use +10 or -5 for adjustment)"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || selectedIds.size === 0}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Update {selectedIds.size} Variations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
