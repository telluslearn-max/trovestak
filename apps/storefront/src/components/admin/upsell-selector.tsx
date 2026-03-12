"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  addProductRelation,
  deleteProductRelation,
  updateProductRelationStrength
} from "@/app/admin/products/actions";
import {
  Search,
  X,
  Plus,
  Zap,
  Package,
  Settings2,
  ArrowRight,
  Puzzle,
  Layers,
  Shield,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  thumbnail_url: string | null;
  slug: string;
}

interface UpsellRelation {
  id: string;
  from_product_id: string;
  to_product_id: string;
  relation_type: "requires_tethering" | "compatible_with" | "accessory_of" | "replaces" | "bundles_with";
  strength: number;
  to_product: Product;
}

const RELATION_TYPES = [
  { value: "compatible_with", label: "Compatible With", icon: Puzzle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "accessory_of", label: "Accessory For", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "requires_tethering", label: "Requires Tether", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "bundles_with", label: "Bundles With", icon: Package, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "replaces", label: "Replaces Old", icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
] as const;

interface UpsellSelectorProps {
  productId: string;
  existingRelations?: UpsellRelation[];
  onChange?: (relations: UpsellRelation[]) => void;
}

export function UpsellSelector({ productId, existingRelations = [], onChange }: UpsellSelectorProps) {
  const [relations, setRelations] = useState<UpsellRelation[]>(existingRelations);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRelations() {
      setLoading(true);
      const { data } = await supabase
        .from("product_relation")
        .select("*, to_product:products!to_product_id(id, name, thumbnail_url, slug)")
        .eq("from_product_id", productId);

      if (data) {
        setRelations(data as unknown as UpsellRelation[]);
      }
      setLoading(false);
    }

    if (productId) {
      fetchRelations();
    }
  }, [productId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      const { data } = await supabase
        .from("products")
        .select("id, name, thumbnail_url, slug")
        .ilike("name", `%${searchQuery}%`)
        .neq("id", productId)
        .limit(8);

      setSearchResults(data || []);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, productId]);

  const handleAddRelation = async (toProduct: Product, relationType: string) => {
    try {
      const result = await addProductRelation(productId, toProduct.id, relationType);

      if (result.success && result.data) {
        const updated = [...relations, result.data as unknown as UpsellRelation];
        setRelations(updated);
        onChange?.(updated);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error adding relation:", err);
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      await deleteProductRelation(relationId, productId);
      const updated = relations.filter((r) => r.id !== relationId);
      setRelations(updated);
      onChange?.(updated);
    } catch (err) {
      console.error("Error deleting relation:", err);
    }
  };

  const handleUpdateStrength = async (relationId: string, strength: number) => {
    try {
      await updateProductRelationStrength(relationId, productId, strength);
      const updated = relations.map((r) =>
        r.id === relationId ? { ...r, strength } : r
      );
      setRelations(updated);
      onChange?.(updated);
    } catch (err) {
      console.error("Error updating strength:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Add Related Products
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
          <Input
            placeholder="Search products to link as upsell/cross-sell..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 pr-4 rounded-2xl bg-muted/30 border-none"
          />
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-card border border-border/50 rounded-2xl p-2 shadow-xl divide-y divide-border/30 mt-2"
            >
              {searchResults.map((product) => (
                <div key={product.id} className="p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {product.thumbnail_url && (
                        <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{product.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {RELATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handleAddRelation(product, type.value)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                          "bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white"
                        )}
                      >
                        <type.icon className="w-3 h-3" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Current Relations ({relations.length})
        </label>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : relations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground/50">
            <Puzzle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold">No related products linked</p>
            <p className="text-xs">Search above to add upsells and cross-sells</p>
          </div>
        ) : (
          <AnimatePresence>
            {relations.map((relation) => {
              const typeInfo = RELATION_TYPES.find((t) => t.value === relation.relation_type) || RELATION_TYPES[0];
              return (
                <motion.div
                  key={relation.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {relation.to_product?.thumbnail_url && (
                      <img src={relation.to_product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                          typeInfo.bg,
                          typeInfo.color
                        )}
                      >
                        <typeInfo.icon className="w-2.5 h-2.5" />
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="font-bold text-sm truncate">{relation.to_product?.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Strength</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={relation.strength}
                        onChange={(e) => handleUpdateStrength(relation.id, parseFloat(e.target.value))}
                        className="w-16 h-1 accent-primary"
                      />
                      <span className="text-[9px] font-bold w-6">{relation.strength.toFixed(1)}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteRelation(relation.id)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
