"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail?: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  vat_total: number;
  total: number;
  vat_enabled: boolean;
  trade_in_credit: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;

  // Actions
  setCart: (cart: Cart) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  toggleVat: (enabled: boolean) => void;
  setTradeInCredit: (amount: number) => void;
  clearTradeInCredit: () => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setIsOpen: (open: boolean) => void;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      // Helper to calculate totals
      const calculateTotals = (items: CartItem[], vatEnabled: boolean, tradeInCredit: number = 0) => {
        const subtotal = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
        const vat_total = vatEnabled ? Math.round(subtotal * 0.16) : 0;
        const total = Math.max(0, subtotal + vat_total - tradeInCredit);
        return { subtotal, vat_total, total };
      };

      return {
        cart: null,
        isLoading: false,
        isOpen: false,

        setCart: (cart) => set({ cart }),

        addItem: (item) => {
          const { cart } = get();
          const currentItems = cart?.items || [];
          const vatEnabled = cart?.vat_enabled || false;
          const tradeInCredit = cart?.trade_in_credit || 0;

          const existingItem = currentItems.find((i) => i.variant_id === item.variant_id);
          let newItems: CartItem[];

          if (existingItem) {
            newItems = currentItems.map((i) =>
              i.variant_id === item.variant_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newItems = [...currentItems, item];
          }

          const totals = calculateTotals(newItems, vatEnabled, tradeInCredit);
          set({
            cart: {
              id: cart?.id || crypto.randomUUID(),
              items: newItems,
              vat_enabled: vatEnabled,
              trade_in_credit: tradeInCredit,
              ...totals,
            },
          });
        },

        removeItem: (itemId) => {
          const { cart } = get();
          if (!cart) return;
          
          const newItems = cart.items.filter((i) => i.id !== itemId);
          const totals = calculateTotals(newItems, cart.vat_enabled, cart.trade_in_credit);
          
          set({
            cart: {
              ...cart,
              items: newItems,
              ...totals,
            },
          });
        },

        updateQuantity: (itemId, quantity) => {
          const { cart } = get();
          if (!cart) return;
          
          const newItems = cart.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          );
          const totals = calculateTotals(newItems, cart.vat_enabled, cart.trade_in_credit);
          
          set({
            cart: {
              ...cart,
              items: newItems,
              ...totals,
            },
          });
        },

        toggleVat: (enabled) => {
          const { cart } = get();
          if (!cart) return;

          const totals = calculateTotals(cart.items, enabled, cart.trade_in_credit);

          set({
            cart: {
              ...cart,
              vat_enabled: enabled,
              ...totals,
            },
          });
        },

        setTradeInCredit: (amount) => {
          const { cart } = get();
          const items = cart?.items || [];
          const vatEnabled = cart?.vat_enabled || false;

          const totals = calculateTotals(items, vatEnabled, amount);

          set({
            cart: {
              id: cart?.id || crypto.randomUUID(),
              items,
              vat_enabled: vatEnabled,
              trade_in_credit: amount,
              ...totals,
            },
          });
        },

        clearTradeInCredit: () => {
          const { cart } = get();
          if (!cart) return;

          const totals = calculateTotals(cart.items, cart.vat_enabled, 0);

          set({
            cart: {
              ...cart,
              trade_in_credit: 0,
              ...totals,
            },
          });
        },

        clearCart: () => set({ cart: null }),
        setLoading: (loading) => set({ isLoading: loading }),
        setIsOpen: (open) => set({ isOpen: open }),
        getCartCount: () => {
          const { cart } = get();
          return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        },
      };
    },
    {
      name: "trovestak-cart",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
