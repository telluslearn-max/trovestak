"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Package, ArrowRight } from "lucide-react";

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const orderRef = orderId ? orderId.slice(0, 8).toUpperCase() : "—";

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-20 pt-[64px]">
            <div className="max-w-md w-full text-center">
                {/* Check mark */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-[#34c759] rounded-full flex items-center justify-center mx-auto mb-8"
                >
                    <Check className="w-10 h-10 text-white stroke-[2.5]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <h1 className="text-[32px] font-semibold text-[#1d1d1f] mb-3">
                        Thank you for your order.
                    </h1>
                    <p className="text-[17px] text-[#6e6e73] mb-10">
                        We&apos;ll send you tracking information once your order ships.
                    </p>
                </motion.div>

                {/* Order card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl p-8 mb-8"
                >
                    <div className="flex items-center justify-center gap-2 text-[#6e6e73] mb-3">
                        <Package className="w-5 h-5" />
                        <span className="text-[14px]">Order number</span>
                    </div>
                    <p className="text-[28px] font-semibold font-mono text-[#1d1d1f] mb-5">
                        #{orderRef}
                    </p>
                    <div className="border-t border-[#f5f5f7] pt-4">
                        <p className="text-[14px] text-[#6e6e73]">
                            Expected delivery: <span className="text-[#1d1d1f] font-medium">3–5 business days</span>
                        </p>
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-3"
                >
                    <Link
                        href="/account/orders"
                        className="w-full py-3.5 bg-black text-white rounded-full text-[17px] font-medium hover:bg-[#1d1d1f] transition-colors flex items-center justify-center gap-2"
                    >
                        View Order <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/store"
                        className="block py-2 text-[17px] text-[#0071e3] hover:underline"
                    >
                        Continue Shopping
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            </div>
        }>
            <OrderConfirmationContent />
        </Suspense>
    );
}
