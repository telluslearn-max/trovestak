"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { scrollReveal } from '@/lib/motion';
import { formatKES } from '@/lib/formatters';
import { ArrowRight } from 'lucide-react';

interface FeaturedProduct {
    name: string;
    slug: string;
    short_desc?: string | null;
    thumbnail_url?: string | null;
    min_price?: number;
}

interface FeatureSectionsProps {
    products: FeaturedProduct[];
}

export function FeatureSections({ products }: FeatureSectionsProps) {
    if (products.length === 0) return null;

    return (
        <section>
            {products.slice(0, 2).map((product, i) => {
                const isEven = i % 2 === 0;
                return (
                    <div
                        key={product.slug}
                        className={`${isEven ? 'bg-white' : 'bg-[#1d1d1f]'} py-20 px-4`}
                    >
                        <motion.div
                            {...scrollReveal}
                            className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12"
                            style={{ flexDirection: isEven ? 'row' : 'row-reverse' }}
                        >
                            {/* Image */}
                            <div className="flex-1 aspect-square max-w-lg w-full relative rounded-2xl overflow-hidden bg-[#f5f5f7]">
                                {product.thumbnail_url ? (
                                    <Image
                                        src={product.thumbnail_url}
                                        alt={product.name}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-full bg-gray-200" />
                                    </div>
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 max-w-md">
                                <h2 className={`text-[48px] font-bold tracking-tight leading-[1.1] mb-4 ${isEven ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                    {product.name}
                                </h2>
                                {product.short_desc && (
                                    <p className={`text-[18px] leading-relaxed mb-6 ${isEven ? 'text-[#6e6e73]' : 'text-[rgba(245,245,247,0.6)]'}`}>
                                        {product.short_desc}
                                    </p>
                                )}
                                {product.min_price && product.min_price > 0 && (
                                    <p className={`text-base mb-6 ${isEven ? 'text-[#6e6e73]' : 'text-[rgba(245,245,247,0.5)]'}`}>
                                        From {formatKES(product.min_price)}
                                    </p>
                                )}
                                <Link
                                    href={`/products/${product.slug}`}
                                    className={`inline-flex items-center gap-2 text-[17px] font-medium ${isEven ? 'text-[#0071e3] hover:underline' : 'text-[#2997ff] hover:underline'}`}
                                >
                                    Shop {product.name} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                );
            })}
        </section>
    );
}
