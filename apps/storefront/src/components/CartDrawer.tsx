"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/stores/cart';
import { formatKES } from '@/lib/formatters';

export function CartDrawer() {
    const { cart, isOpen, setIsOpen, removeItem, updateQuantity } = useCartStore();
    const items = cart?.items ?? [];
    const subtotal = cart?.subtotal ?? 0;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col bg-white">
                <SheetHeader className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-base font-semibold text-[#1d1d1f]">
                            Bag {items.length > 0 && <span className="text-[#6e6e73] font-normal">({items.length})</span>}
                        </SheetTitle>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-[#1d1d1f]" />
                        </button>
                    </div>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                            <ShoppingBag className="w-7 h-7 text-[#6e6e73]" />
                        </div>
                        <div>
                            <p className="font-medium text-[#1d1d1f] mb-1">Your bag is empty</p>
                            <p className="text-sm text-[#6e6e73]">Add items to get started</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="mt-2 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/90 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Items list */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-[#f5f5f7] flex-shrink-0 overflow-hidden">
                                        {item.thumbnail ? (
                                            <Image
                                                src={item.thumbnail}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="w-6 h-6 text-[#6e6e73]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1d1d1f] line-clamp-2 mb-1">{item.title}</p>
                                        <p className="text-sm font-semibold text-[#1d1d1f]">{formatKES(item.unit_price * item.quantity)}</p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3 py-1">
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity <= 1) removeItem(item.id);
                                                        else updateQuantity(item.id, item.quantity - 1);
                                                    }}
                                                    className="text-[#1d1d1f] hover:text-black transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="text-[#1d1d1f] hover:text-black transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-xs text-[#6e6e73] hover:text-red-500 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 border-t border-gray-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#6e6e73]">Subtotal</span>
                                <span className="text-base font-semibold text-[#1d1d1f]">{formatKES(subtotal)}</span>
                            </div>
                            <p className="text-xs text-[#6e6e73]">Shipping and VAT calculated at checkout</p>

                            <Link
                                href="/checkout"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/90 transition-colors"
                            >
                                Checkout
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                href="/cart"
                                onClick={() => setIsOpen(false)}
                                className="block text-center text-sm text-[#0071e3] hover:underline"
                            >
                                View full bag
                            </Link>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
