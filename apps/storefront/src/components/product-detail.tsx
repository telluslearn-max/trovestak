"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus, ShoppingBag, Check, Smartphone, RefreshCw, ArrowRight, Zap } from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { useCartStore } from "@/stores/cart";
import { ProductCard } from "./product-card";

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  product_variants: Array<{
    id: string;
    name: string;
    price_kes: number;
    options?: any;
  }>;
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.product_variants[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();

  const price = selectedVariant?.price_kes || 0;
  const images = product.thumbnail_url ? [{ url: product.thumbnail_url }] : [];

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      product_id: product.id,
      variant_id: selectedVariant.id,
      title: `${product.name} - ${selectedVariant.name}`,
      quantity,
      unit_price: price,
      thumbnail: product.thumbnail_url,
    });

    setIsAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-apple-text-secondary mb-8">
        <Link href="/store" className="hover:text-apple-text cursor-pointer">Store</Link>
        <span className="mx-2">›</span>
        <span className="text-apple-text">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-apple-gray dark:bg-gray-800 rounded-2xl overflow-hidden">
            {images.length > 0 && (
              <Image
                src={images[selectedImage].url}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index
                    ? "border-apple-blue"
                    : "border-transparent hover:border-apple-border dark:hover:border-apple-border-dark"
                    }`}
                >
                  <Image
                    src={image.url}
                    alt={`${product.name} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-apple-text dark:text-white mb-2">
              {product.name}
            </h1>
            <p className="text-2xl font-medium text-apple-text dark:text-gray-300">
              {formatKES(price)}
            </p>
          </div>

          {/* Variant Selector */}
          {product.product_variants.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-apple-text dark:text-white">
                Select Option
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.product_variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${selectedVariant.id === variant.id
                      ? "border-apple-blue bg-apple-blue/10 text-apple-blue"
                      : "border-apple-border dark:border-apple-border-dark text-apple-text dark:text-white hover:border-apple-blue"
                      }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-apple-text dark:text-white">Quantity</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border border-apple-border dark:border-apple-border-dark flex items-center justify-center hover:bg-apple-gray dark:hover:bg-gray-800 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-medium text-apple-text dark:text-white w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border border-apple-border dark:border-apple-border-dark flex items-center justify-center hover:bg-apple-gray dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-full font-medium text-lg transition-colors flex items-center justify-center gap-2 ${addedToCart
              ? "bg-green-500 text-white"
              : "bg-apple-blue text-white hover:bg-apple-blue-hover"
              }`}
          >
            <AnimatePresence mode="wait">
              {addedToCart ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Added to Bag
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isAddingToCart ? "Adding..." : "Add to Bag"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Shipping Info */}
          <div className="text-sm text-apple-text-secondary space-y-1">
            <p>Free shipping on orders over KES 50,000</p>
            <p>Delivery within 2-5 business days</p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-6 border-t border-apple-border dark:border-apple-border-dark">
              <h3 className="text-lg font-semibold text-apple-text dark:text-white mb-3">
                Description
              </h3>
              <p className="text-apple-text-secondary leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Works With - Compatible Devices */}
          <div className="pt-6 border-t border-apple-border dark:border-apple-border-dark">
            <h3 className="text-lg font-semibold text-apple-text dark:text-white mb-4">
              Works With
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Smartphone, label: "iPhone", compat: "15 Pro Max" },
                { icon: Smartphone, label: "iPad", compat: "Pro 12.9\"" },
                { icon: Smartphone, label: "Mac", compat: "M3 MacBook" },
              ].map((device, index) => (
                <motion.div
                  key={device.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center p-4 bg-apple-gray/50 dark:bg-gray-800/50 rounded-xl"
                >
                  <device.icon className="w-8 h-8 text-apple-blue mb-2" />
                  <span className="text-sm font-medium text-apple-text dark:text-white">
                    {device.label}
                  </span>
                  <span className="text-xs text-apple-text-secondary">
                    {device.compat}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trade-In CTA */}
          <div className="pt-6 border-t border-apple-border dark:border-apple-border-dark">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-r from-apple-blue/10 to-purple-500/10 dark:from-apple-blue/20 dark:to-purple-500/20 rounded-2xl p-5 border border-apple-blue/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-apple-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-apple-text dark:text-white mb-1">
                    Trade In & Save
                  </h3>
                  <p className="text-sm text-apple-text-secondary mb-3">
                    Get up to {formatKES(5000000)} credit when you trade in your eligible device.
                    Lower your monthly payments or reduce the upfront cost.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="text-apple-blue hover:underline font-medium flex items-center gap-1">
                      Get estimate
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="text-apple-text-secondary">|</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <Zap className="w-4 h-4" />
                      <span>Instant credit</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
