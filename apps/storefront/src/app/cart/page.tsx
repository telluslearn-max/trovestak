"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, ChevronRight, MessageCircle } from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { useCartStore } from "@/stores/cart";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, toggleVat, clearTradeInCredit } = useCartStore();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full glass-card rounded-[2.5rem] p-12 text-center border-dashed border-2 border-muted-foreground/20"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">
            Your bag is <span className="text-muted-foreground/40 italic">empty.</span>
          </h1>
          <p className="text-muted-foreground font-medium mb-10 leading-relaxed">
            Excellence awaits. Explore our curated selection of premium gear and specialized equipment.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center justify-center px-10 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all duration-500 shadow-2xl shadow-foreground/20"
          >
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const vatAmount = cart.vat_total || 0;
  const tradeInCredit = cart.trade_in_credit || 0;
  const total = cart.total;

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-8 selection:bg-primary/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-4">
            Review Your <span className="text-muted-foreground/40 italic font-serif">Bag.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'} ready for acquisition.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
                  className="group relative glass-card rounded-[2rem] p-6 border border-apple-border dark:border-apple-border-dark flex items-center gap-6 md:gap-8 transition-all hover:shadow-2xl hover:shadow-primary/5"
                >
                  {/* Image */}
                  <div className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0 bg-muted/30 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 py-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-lg font-black text-foreground ml-4">
                        {formatKES(item.unit_price * item.quantity)}
                      </p>
                    </div>

                    <p className="text-sm font-medium text-muted-foreground/80 mb-6">
                      {formatKES(item.unit_price)} per unit
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      {/* Quantity Controls */}
                      <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 border border-apple-border/50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-black transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-black w-10 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-black transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-3 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 sticky top-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-[2.5rem] p-8 md:p-10 border-2 border-primary/10 shadow-3xl"
            >
              <h2 className="text-2xl font-black tracking-tight text-foreground mb-8">
                Acquisition Summary
              </h2>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-black uppercase tracking-widest">Subtotal</span>
                  <span className="text-foreground font-black">{formatKES(subtotal)}</span>
                </div>

                {/* VAT Toggle */}
                <div className="group flex items-center justify-between py-4 border-y border-apple-border dark:border-apple-border-dark">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground">Include VAT</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter italic">Standard 16% Compliance</span>
                  </div>
                  <Switch
                    checked={cart.vat_enabled}
                    onCheckedChange={(checked) => toggleVat(checked)}
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-black uppercase tracking-widest">VAT (16%)</span>
                  <span className={cn("font-black transition-all", cart.vat_enabled ? "text-foreground" : "text-muted-foreground/30")}>
                    {cart.vat_enabled ? formatKES(vatAmount) : formatKES(0)}
                  </span>
                </div>

                {tradeInCredit > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex justify-between items-center text-sm py-4 border-y border-emerald-500/20 bg-emerald-500/5 -mx-8 px-8"
                  >
                    <div className="flex flex-col">
                      <span className="text-emerald-500 font-black uppercase tracking-widest">Trade-in Credit</span>
                      <button
                        onClick={() => clearTradeInCredit()}
                        className="text-[9px] font-black uppercase tracking-widest text-emerald-500/40 hover:text-red-500 transition-colors text-left"
                      >
                        Remove Credit
                      </button>
                    </div>
                    <span className="text-emerald-500 font-black">-{formatKES(tradeInCredit)}</span>
                  </motion.div>
                ) : (
                  <Link
                    href="/trade-in"
                    className="flex items-center justify-between py-4 border-y border-apple-border dark:border-apple-border-dark group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Apply Trade-in</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter italic">Lower your deployment cost</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-black uppercase tracking-widest">Insurance & Tax</span>
                  <span className="text-muted-foreground font-black">EXEMPT</span>
                </div>

                <div className="pt-4 mt-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-md font-black uppercase tracking-[0.2em] text-foreground/50">Total Amount</span>
                    <span className="text-3xl font-black tracking-tighter text-foreground">{formatKES(total)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Secure Transaction Locked
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-10 w-full group relative py-6 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] overflow-hidden flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-2xl shadow-foreground/20"
              >
                <div className="absolute inset-0 bg-primary/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
                <span className="relative z-10">Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 relative z-10 translate-x-0 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>

              {/* WhatsApp Checkout Option */}
              <a
                href={`https://wa.me/254700000000?text=${encodeURIComponent(`Hi! I'd like to complete my order of ${cart.items.length} items totaling ${formatKES(total)}. Items: ${cart.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full group relative py-4 border-2 border-green-500/20 hover:border-green-500/50 hover:bg-green-500/5 text-green-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <span>Order via WhatsApp</span>
              </a>

              <p className="mt-8 text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold leading-relaxed opacity-60">
                Triple-validated logistics <br />
                M-Pesa Daraja 3.0 Integrated
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
