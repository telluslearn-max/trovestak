"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

interface WishlistItem {
    id: string;
    product_id: string;
    variant_id: string;
    title: string;
    unit_price: number;
    thumbnail?: string;
    slug: string;
    added_at: string;
}

interface WishlistState {
    items: WishlistItem[];
    isLoading: boolean;
    
    // Actions
    setItems: (items: WishlistItem[]) => void;
    addItem: (item: WishlistItem) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    moveToCart: (productId: string, addToCart: (item: any) => void) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
    syncWithServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,

            setItems: (items) => set({ items }),

            addItem: async (item) => {
                const { items } = get();
                
                // Check if already in wishlist
                if (items.some(i => i.product_id === item.product_id)) return;

                // Optimistic update
                set({ items: [...items, item] });

                // Sync with server if logged in
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('wishlist_items').insert([{
                            user_id: user.id,
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                        }]);
                    }
                } catch (err) {
                    console.error('Wishlist sync error:', err);
                }
            },

            removeItem: async (productId) => {
                const { items } = get();
                
                // Optimistic update
                set({ items: items.filter(i => i.product_id !== productId) });

                // Sync with server
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from('wishlist_items')
                            .delete()
                            .eq('user_id', user.id)
                            .eq('product_id', productId);
                    }
                } catch (err) {
                    console.error('Wishlist remove error:', err);
                }
            },

            moveToCart: async (productId, addToCart) => {
                const { items } = get();
                const item = items.find(i => i.product_id === productId);
                
                if (item) {
                    addToCart({
                        id: `${item.product_id}-${item.variant_id}`,
                        product_id: item.product_id,
                        variant_id: item.variant_id,
                        title: item.title,
                        quantity: 1,
                        unit_price: item.unit_price,
                        thumbnail: item.thumbnail,
                    });
                    
                    await get().removeItem(productId);
                }
            },

            isInWishlist: (productId) => {
                return get().items.some(i => i.product_id === productId);
            },

            clearWishlist: () => set({ items: [] }),

            syncWithServer: async () => {
                try {
                    set({ isLoading: true });
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (user) {
                        const { data } = await supabase
                            .from('wishlist_items')
                            .select(`
                                id,
                                product_id,
                                variant_id,
                                created_at,
                                products (
                                    name,
                                    slug,
                                    thumbnail_url,
                                    product_variants!inner (price_kes)
                                )
                            `)
                            .eq('user_id', user.id);

                        if (data) {
                            const items: WishlistItem[] = data.map((item: any) => ({
                                id: item.id,
                                product_id: item.product_id,
                                variant_id: item.variant_id,
                                title: item.products?.name || '',
                                unit_price: item.products?.product_variants?.[0]?.price_kes
                                    ? item.products.product_variants[0].price_kes
                                    : 0,
                                thumbnail: item.products?.thumbnail_url,
                                slug: item.products?.slug || '',
                                added_at: item.created_at,
                            }));
                            set({ items });
                        }
                    }
                } catch (err) {
                    console.error('Wishlist sync error:', err);
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: "trovestak-wishlist",
            partialize: (state) => ({ items: state.items }),
        }
    )
);
