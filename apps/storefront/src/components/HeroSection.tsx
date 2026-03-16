"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatKES } from '@/lib/formatters';

interface HeroProduct {
    name: string;
    slug: string;
    thumbnail_url: string | null;
    short_desc?: string | null;
    min_price?: number;
}

interface HeroSectionProps {
    product: HeroProduct;
}

export function HeroSection({ product }: HeroSectionProps) {
    const isDark = true; // product photography determines this; default to dark

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1d1d1f]">
            {/* Background image */}
            {product.thumbnail_url && (
                <div className="absolute inset-0">
                    <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        priority
                        className="object-cover opacity-40"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1d1d1f]" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgba(245,245,247,0.6)] mb-4"
                >
                    New
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-[40px] md:text-[72px] font-bold tracking-tight leading-[1.05] text-white mb-4"
                >
                    {product.name}
                </motion.h1>

                {product.short_desc && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-xl md:text-2xl text-[rgba(245,245,247,0.6)] mb-2 max-w-xl mx-auto"
                    >
                        {product.short_desc}
                    </motion.p>
                )}

                {product.min_price && product.min_price > 0 && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.6 }}
                        className="text-base text-[rgba(245,245,247,0.5)] mb-8"
                    >
                        From {formatKES(product.min_price)}
                    </motion.p>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex items-center justify-center gap-4"
                >
                    <Link
                        href={`/products/${product.slug}`}
                        className="px-8 py-3 bg-white text-[#1d1d1f] text-[17px] font-medium rounded-full hover:bg-white/90 transition-colors"
                    >
                        Shop now
                    </Link>
                    <Link
                        href={`/products/${product.slug}`}
                        className="px-8 py-3 border border-white/30 text-white text-[17px] font-medium rounded-full hover:bg-white/10 transition-colors"
                    >
                        Learn more
                    </Link>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
            >
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <ChevronDown className="w-6 h-6 text-[rgba(245,245,247,0.4)]" />
                </motion.div>
            </motion.div>
        </section>
    );
}
