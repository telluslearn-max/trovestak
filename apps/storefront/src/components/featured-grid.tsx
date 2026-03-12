"use client";

import { motion } from "framer-motion";
import { ProductCard } from "./product-card";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  thumbnail_url?: string;
  product_variants?: Array<{
    id: string;
    price_kes: number;
  }>;
}

interface FeaturedGridProps {
  products: Product[];
  title?: string;
}

export function FeaturedGrid({ products, title = "Featured Products" }: FeaturedGridProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-between items-end mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <Link
          href="/store"
          className="text-primary hover:underline text-sm font-medium mb-1 transition-colors"
        >
          View All Products
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
