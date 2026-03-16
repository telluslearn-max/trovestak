"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { scrollReveal } from '@/lib/motion';
import { formatKES } from '@/lib/formatters';

interface ShelfProduct {
    name: string;
    slug: string;
    thumbnail_url?: string | null;
    short_desc?: string | null;
    min_price?: number;
    created_at?: string | null;
}

interface ProductShelfProps {
    products: ShelfProduct[];
}

function isNew(createdAt?: string | null): boolean {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - created.getTime() < msInWeek;
}

export function ProductShelf({ products }: ProductShelfProps) {
    if (products.length === 0) return null;

    return (
        <section className="bg-white py-16 px-6">
            <motion.div {...scrollReveal} className="max-w-7xl mx-auto">
                <div className="flex items-baseline justify-between mb-8">
                    <h2 className="text-[28px] font-semibold text-[#1d1d1f]">Just In</h2>
                    <Link href="/store" className="text-[15px] text-[#0071e3] hover:underline font-medium">
                        See all ›
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                    {products.map((product, i) => (
                        <motion.div
                            key={product.slug}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06, duration: 0.5 }}
                        >
                            <Link href={`/products/${product.slug}`} className="group block">
                                {/* Image */}
                                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#f5f5f7] mb-4">
                                    {product.thumbnail_url ? (
                                        <Image
                                            src={product.thumbnail_url}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-300"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-[#e5e5ea]" />
                                        </div>
                                    )}
                                    {isNew(product.created_at) && (
                                        <span className="absolute top-3 left-3 bg-[#f59e0b] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                            NEW
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <p className="text-[15px] font-semibold text-[#1d1d1f] leading-snug mb-1 group-hover:text-[#0071e3] transition-colors">
                                    {product.name}
                                </p>
                                {product.short_desc && (
                                    <p className="text-[13px] text-[#86868b] leading-snug line-clamp-2 mb-1">
                                        {product.short_desc}
                                    </p>
                                )}
                                {product.min_price && product.min_price > 0 && (
                                    <p className="text-[14px] text-[#1d1d1f] font-medium">
                                        From {formatKES(product.min_price)}
                                    </p>
                                )}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
