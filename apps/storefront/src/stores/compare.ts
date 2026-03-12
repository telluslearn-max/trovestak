"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareProduct {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    brand_type: string | null;
    price: number;
    specs: Record<string, Record<string, string>>;
    highlights: string[];
}

interface CompareState {
    products: CompareProduct[];
    maxProducts: number;
    
    // Actions
    addProduct: (product: CompareProduct) => boolean;
    removeProduct: (productId: string) => void;
    isInCompare: (productId: string) => boolean;
    canAddMore: () => boolean;
    clearCompare: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set, get) => ({
            products: [],
            maxProducts: 4,

            addProduct: (product) => {
                const { products, maxProducts } = get();
                
                if (products.length >= maxProducts) return false;
                if (products.some(p => p.id === product.id)) return false;

                set({ products: [...products, product] });
                return true;
            },

            removeProduct: (productId) => {
                set({ products: get().products.filter(p => p.id !== productId) });
            },

            isInCompare: (productId) => {
                return get().products.some(p => p.id === productId);
            },

            canAddMore: () => {
                return get().products.length < get().maxProducts;
            },

            clearCompare: () => set({ products: [] }),
        }),
        {
            name: "trovestak-compare",
            partialize: (state) => ({ products: state.products }),
        }
    )
);
