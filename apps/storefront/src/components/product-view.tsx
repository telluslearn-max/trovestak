"use client";

import { useState, useMemo } from "react";
import { useCartStore } from "@/stores/cart";
import { Check, ShoppingBag, Sparkles } from "lucide-react";
import { MeshUpsellWidget } from "./mesh-upsell-widget";

interface Variant {
    id: string;
    sku: string;
    options: {
        color?: string | null;
        storage?: string | null;
        condition?: string | null;
    };
    price_history?: any;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    variants?: Variant[];
}

interface ProductViewProps {
    product: Product;
    initialOffers: Record<string, number>; // Map variant_id -> cost_price
}

export function ProductView({ product, initialOffers }: ProductViewProps) {
    const variants = product.variants || [];
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
        variants[0]?.id || ""
    );

    const { addItem } = useCartStore();

    const selectedVariant = variants.find(v => v.id === selectedVariantId);
    const price = initialOffers[selectedVariantId];

    // Group variants by options
    const uniqueColors = Array.from(new Set(variants.map(v => v.options?.color).filter(Boolean)));
    const uniqueStorages = Array.from(new Set(variants.map(v => v.options?.storage).filter(Boolean)));

    const handleAddToCart = () => {
        if (!selectedVariant) return;

        addItem({
            id: selectedVariant.id,
            product_id: product.id,
            variant_id: selectedVariant.id,
            title: `${product.name} ${selectedVariant.options?.storage || ''} ${selectedVariant.options?.color || ''}`,
            unit_price: price || 0,
            thumbnail: product.image_url || "/placeholder.png",
            quantity: 1,
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
                    <img
                        src={product.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Product Details */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">{product.name}</h1>

                <div className="flex items-baseline gap-4 mb-6">
                    {price ? (
                        <span className="text-3xl font-bold text-primary">
                            KES {(price / 100).toLocaleString()}
                        </span>
                    ) : (
                        <span className="text-2xl font-bold text-muted-foreground">Out of Stock</span>
                    )}
                </div>

                {/* Variant Selectors */}
                <div className="space-y-6 mb-8">
                    {/* Storage Selection (if applicable) */}
                    {uniqueStorages.length > 0 && (
                        <div>
                            <span className="text-sm font-medium text-muted-foreground mb-3 block">Storage</span>
                            <div className="flex flex-wrap gap-3">
                                {uniqueStorages.map((storage) => {
                                    // Find a variant with this storage to get ID (naive approach for now)
                                    const v = variants.find(v => v.options?.storage === storage);
                                    const isSelected = selectedVariant?.options?.storage === storage;
                                    return (
                                        <button
                                            key={storage as string}
                                            onClick={() => v && setSelectedVariantId(v.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${isSelected
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-transparent bg-muted hover:bg-muted/80"
                                                }`}
                                        >
                                            {storage}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Color Selection (if applicable) */}
                    {uniqueColors.length > 0 && (
                        <div>
                            <span className="text-sm font-medium text-muted-foreground mb-3 block">Color</span>
                            <div className="flex flex-wrap gap-3">
                                {uniqueColors.map((color) => {
                                    const v = variants.find(v => v.options?.color === color);
                                    const isSelected = selectedVariant?.options?.color === color;
                                    return (
                                        <button
                                            key={color as string}
                                            onClick={() => v && setSelectedVariantId(v.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${isSelected
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-transparent bg-muted hover:bg-muted/80"
                                                }`}
                                        >
                                            {color}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-8">
                    {product.description || "No description available."}
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={handleAddToCart}
                        disabled={!price}
                        className="flex-1 bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        {price ? "Add to Bag" : "Unavailable"}
                    </button>
                </div>

                {/* Verification Metadata for Admin/Debug */}
                <div className="mt-8 p-4 bg-muted/30 rounded-xl text-xs font-mono text-muted-foreground">
                    <p>Variant ID: {selectedVariantId}</p>
                    <p>SKU: {selectedVariant?.sku}</p>
                </div>
            </div>

            {/* Mesh Ecosystem Section */}
            <div className="md:col-span-2 mt-20 border-t border-border/50 pt-20">
                <MeshUpsellWidget
                    title="Complete the Ecosystem"
                    layout="grid"
                    className="max-w-5xl mx-auto"
                />
            </div>
        </div>
    );
}
