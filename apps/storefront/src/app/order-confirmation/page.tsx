"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage() {
  // In production, this would come from the order API
  const orderNumber = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <div className="min-h-screen bg-apple-gray dark:bg-apple-dark flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-semibold text-apple-text dark:text-white mb-4"
        >
          Order Confirmed!
        </motion.h1>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-apple-text-secondary">
              <Package className="w-5 h-5" />
              <span>Order Number</span>
            </div>
            <p className="text-2xl font-mono font-semibold text-apple-text dark:text-white">
              #{orderNumber}
            </p>
            <div className="border-t border-apple-border dark:border-apple-border-dark pt-4">
              <div className="flex items-center justify-center gap-2 text-apple-text-secondary text-sm">
                <Mail className="w-4 h-4" />
                <span>Confirmation email sent</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4 text-apple-text-secondary mb-8"
        >
          <p>
            Thank you for your order! We&apos;ll send you tracking information once your order ships.
          </p>
          <p className="text-sm">
            Expected delivery: <span className="text-apple-text dark:text-white font-medium">3-5 business days</span>
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Link
            href="/account/orders"
            className="w-full py-4 bg-apple-blue text-white rounded-full font-medium hover:bg-apple-blue-hover transition-colors flex items-center justify-center gap-2"
          >
            View Order
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/store"
            className="w-full py-3 text-apple-blue hover:underline block"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
