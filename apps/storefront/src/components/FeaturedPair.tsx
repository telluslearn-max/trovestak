"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatKES } from '@/lib/formatters';
import { staggerChild } from '@/lib/motion';
import type { FeatureTileProduct } from './FeatureTile';

const BtnBlue = "inline-flex items-center justify-center rounded-full bg-[#0071e3] text-white text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.03]";
const BtnOutline = "inline-flex items-center justify-center rounded-full text-[#0071e3] text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[rgba(0,113,227,0.06)]";
const BtnDarkOutline = "inline-flex items-center justify-center rounded-full text-white/85 text-[13px] font-normal px-4 py-[7px] border border-white/50 transition-all duration-200 hover:bg-white/10";

interface FeaturedPairProps {
    left: FeatureTileProduct | null;
    right: FeatureTileProduct | null;
    leftBg?: string;
    rightBg?: string;
}

function PairTile({
    product,
    bg,
    rounded,
}: {
    product: FeatureTileProduct | null;
    bg: string;
    rounded?: boolean;
}) {
    const isDark = bg === '#1d1d1f' || bg === '#000000';

    if (!product) {
        return (
            <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`relative flex flex-col items-center overflow-hidden min-h-[500px] md:min-h-[560px] ${rounded ? 'rounded-[20px]' : ''}`}
                style={{ background: bg }}
            >
                <div className="w-full flex flex-col items-center text-center px-10 pt-[52px] pb-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73] mb-2">
                        Coming Soon
                    </p>
                    <h2 className={`text-[clamp(28px,3vw,38px)] font-semibold leading-[1.08] tracking-tight ${isDark ? 'text-white' : 'text-apple-text'}`}>
                        New Arrivals
                    </h2>
                    <p className={`text-[17px] leading-[1.4] max-w-[340px] mt-2 ${isDark ? 'text-white/75' : 'text-apple-text'}`}>
                        More great products coming your way.
                    </p>
                </div>
                <div className="flex-1 w-full flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }} />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative flex flex-col items-center overflow-hidden min-h-[500px] md:min-h-[560px] ${rounded ? 'rounded-[20px]' : ''}`}
            style={{ background: bg }}
        >
            {/* Text */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ staggerChildren: 0.06 }}
                className="w-full flex flex-col items-center text-center px-10 pt-[52px] pb-6"
            >
                {product.nav_category && (
                    <motion.p
                        variants={staggerChild.variants}
                        className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73] mb-2"
                    >
                        {product.nav_category}
                    </motion.p>
                )}

                <motion.h2
                    variants={staggerChild.variants}
                    className={`text-[clamp(28px,3vw,38px)] font-semibold leading-[1.08] tracking-tight ${isDark ? 'text-white' : 'text-apple-text'}`}
                >
                    {product.name}
                </motion.h2>

                {product.short_desc && (
                    <motion.p
                        variants={staggerChild.variants}
                        className={`text-[17px] leading-[1.4] max-w-[340px] mt-2 ${isDark ? 'text-white/75' : 'text-apple-text'}`}
                    >
                        {product.short_desc}
                    </motion.p>
                )}

                {product.min_price && product.min_price > 0 && (
                    <motion.p
                        variants={staggerChild.variants}
                        className={`text-[15px] md:text-[17px] mt-1 ${isDark ? 'text-white/50' : 'text-apple-text-tertiary'}`}
                    >
                        From {formatKES(product.min_price)}
                    </motion.p>
                )}

                <motion.div
                    variants={staggerChild.variants}
                    className="flex flex-col sm:flex-row items-center gap-3 mt-4"
                >
                    <Link
                        href={`/products/${product.slug}#details`}
                        className={isDark ? BtnDarkOutline : BtnOutline}
                    >
                        Learn more
                    </Link>
                    <Link
                        href={`/products/${product.slug}`}
                        className={BtnBlue}
                    >
                        Shop {product.name}
                    </Link>
                </motion.div>
            </motion.div>

            {/* Image */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative flex-1 w-full max-w-sm mx-auto min-h-[180px] md:min-h-[220px]"
            >
                {product.thumbnail_url ? (
                    <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        className="object-contain p-6"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-apple-border" />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export function FeaturedPair({ left, right, leftBg = '#1d1d1f', rightBg = '#e8f4ff' }: FeaturedPairProps) {
    return (
        /* 10px gap with padding on a neutral bg */
        <section className="w-full px-[10px] pb-[10px]" style={{ background: '#f5f5f7' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                <PairTile product={left} bg={leftBg} rounded />
                <PairTile product={right} bg={rightBg} rounded />
            </div>
        </section>
    );
}
