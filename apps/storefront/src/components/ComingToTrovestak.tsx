"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, Lock } from 'lucide-react';
import { formatKES } from '@/lib/formatters';

interface Product {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    created_at: string;
    metadata?: {
        key_spec?: string;
        expected_availability?: string;
    };
    product_variants?: { price_kes: number }[];
}

interface ComingToTrovestakProps {
    upcomingProducts: Product[];
    newArrivals: Product[];
    isProMember?: boolean;
}

export function ComingToTrovestak({ upcomingProducts, newArrivals, isProMember = false }: ComingToTrovestakProps) {
    const allProducts = [...(upcomingProducts || []), ...(newArrivals || [])];

    if (allProducts.length === 0) {
        return null;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <section className="bg-white py-12 md:py-16 px-4 md:px-6">
            <div className="max-w-[980px] mx-auto">
                {/* Section heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5 }}
                    className="text-[28px] md:text-[32px] font-semibold text-[#1d1d1f] mb-8"
                >
                    Coming to Trovestak.
                </motion.h2>

                {/* Products grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {allProducts.map((product, idx) => {
                        const isUpcoming = upcomingProducts.find(p => p.id === product.id);
                        const isNew = newArrivals.find(p => p.id === product.id);
                        const minPrice = product.product_variants
                            ? Math.min(...product.product_variants.map(v => v.price_kes).filter(p => p > 0))
                            : 0;

                        return (
                            <motion.div
                                key={product.id}
                                variants={itemVariants}
                                className="rounded-lg overflow-hidden border border-[#D2D2D7] hover:shadow-md transition-shadow"
                            >
                                {/* Product image */}
                                <div className="relative bg-[#f5f5f7] aspect-square overflow-hidden">
                                    {product.thumbnail_url ? (
                                        <Image
                                            src={product.thumbnail_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#f5f5f7]">
                                            <div className="w-16 h-16 rounded-full bg-[#e5e5ea]" />
                                        </div>
                                    )}

                                    {/* New badge */}
                                    {isNew && (
                                        <div className="absolute top-4 right-4 bg-[#0071e3] text-white px-3 py-1 rounded-full text-[12px] font-semibold">
                                            New
                                        </div>
                                    )}
                                </div>

                                {/* Product info */}
                                <div className="p-4 md:p-6 flex flex-col justify-between min-h-[220px]">
                                    {/* Name + spec */}
                                    <div>
                                        <h3 className="text-[17px] md:text-[19px] font-semibold text-[#1d1d1f] mb-2">
                                            {product.name}
                                        </h3>

                                        {/* Key spec or price */}
                                        {isUpcoming && product.metadata?.key_spec ? (
                                            <p className="text-[15px] text-[#6e6e73] mb-2">
                                                {product.metadata.key_spec}
                                            </p>
                                        ) : minPrice > 0 ? (
                                            <p className="text-[15px] text-[#6e6e73] mb-2">
                                                From {formatKES(minPrice)}
                                            </p>
                                        ) : null}

                                        {/* Expected availability */}
                                        {isUpcoming && product.metadata?.expected_availability && (
                                            <p className="text-[13px] text-[#6e6e73] italic">
                                                Available: {product.metadata.expected_availability}
                                            </p>
                                        )}
                                    </div>

                                    {/* CTAs */}
                                    <div className="flex flex-col gap-2 mt-4">
                                        {isUpcoming ? (
                                            <>
                                                <Link
                                                    href={`/products/${product.slug}#specs`}
                                                    className="text-[15px] text-[#0071e3] hover:underline"
                                                >
                                                    Read specs ›
                                                </Link>
                                                <button className="flex items-center gap-2 text-[15px] text-[#0071e3] hover:underline text-left">
                                                    <Bell className="w-4 h-4" />
                                                    Notify me
                                                </button>
                                                <button className={`flex items-center gap-2 text-[15px] ${isProMember ? 'text-[#0071e3] hover:underline' : 'text-[#a1a1a6]'}`}>
                                                    {!isProMember && <Lock className="w-4 h-4" />}
                                                    {isProMember ? 'Pre-order' : 'Pre-order (Pro)'}
                                                </button>
                                            </>
                                        ) : (
                                            <Link
                                                href={`/products/${product.slug}`}
                                                className="text-[15px] text-[#0071e3] hover:underline"
                                            >
                                                Shop now ›
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
