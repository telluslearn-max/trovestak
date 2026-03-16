"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { formatKES } from '@/lib/formatters';

interface MinimalProduct {
    id: string;
    slug: string;
    name: string;
    brand?: string | null;
    thumbnail_url?: string | null;
    product_variants?: Array<{ price_kes: number }> | null;
}

interface ProductCardMinimalProps {
    product: MinimalProduct;
}

export function ProductCardMinimal({ product }: ProductCardMinimalProps) {
    const variants = product.product_variants || [];
    const prices = variants.map(v => v.price_kes).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return (
        <Link href={`/products/${product.slug}`} className="group block">
            <div className="bg-white rounded-2xl overflow-hidden">
                {/* Image — 80% of card height */}
                <div className="aspect-square bg-[#f5f5f7] flex items-center justify-center overflow-hidden p-6">
                    {product.thumbnail_url ? (
                        <motion.div
                            className="w-full h-full relative"
                            whileHover={{ scale: 1.04 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />
                        </motion.div>
                    ) : (
                        <Package className="w-12 h-12 text-[#6e6e73]" />
                    )}
                </div>

                {/* Info */}
                <div className="px-4 pb-5 pt-3">
                    {product.brand && (
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[#6e6e73] mb-0.5">
                            {product.brand}
                        </p>
                    )}
                    <p className="text-[16px] font-medium text-[#1d1d1f] line-clamp-2 leading-snug mb-1">
                        {product.name}
                    </p>
                    <p className="text-[14px] text-[#6e6e73]">
                        {minPrice > 0 ? `From ${formatKES(minPrice)}` : 'Price on request'}
                    </p>
                </div>
            </div>
        </Link>
    );
}
