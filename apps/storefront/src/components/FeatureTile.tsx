"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatKES } from '@/lib/formatters';
import { staggerChild } from '@/lib/motion';

export interface FeatureTileProduct {
    name: string;
    slug: string;
    thumbnail_url: string | null;
    short_desc?: string | null;
    min_price?: number;
    nav_category?: string | null;
}

export type FeatureTileBackground = 'dark' | 'black' | 'light' | 'gray' | 'cream';

const BG: Record<FeatureTileBackground, string> = {
    dark:  '#1d1d1f',
    black: '#000000',
    light: '#ffffff',
    gray:  'radial-gradient(ellipse 120% 80% at 50% 100%, #e8f4ff 0%, #f5f5f7 60%)',
    cream: '#fbfbfd',
};

const TEXT_COLOR: Record<FeatureTileBackground, string> = {
    dark:  'text-white',
    black: 'text-white',
    light: 'text-apple-text',
    gray:  'text-apple-text',
    cream: 'text-apple-text',
};

const SUBTEXT_COLOR: Record<FeatureTileBackground, string> = {
    dark:  'text-white/60',
    black: 'text-white/60',
    light: 'text-apple-text-tertiary',
    gray:  'text-apple-text-tertiary',
    cream: 'text-apple-text-tertiary',
};

interface FeatureTileProps {
    product: FeatureTileProduct | null;
    background: FeatureTileBackground;
}

const BtnBlue = "inline-flex items-center justify-center rounded-full bg-[#0071e3] text-white text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.03]";
const BtnOutline = "inline-flex items-center justify-center rounded-full text-[#0071e3] text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[rgba(0,113,227,0.06)]";
const BtnDarkOutline = "inline-flex items-center justify-center rounded-full text-white/85 text-[13px] font-normal px-4 py-[7px] border border-white/50 transition-all duration-200 hover:bg-white/10";

const FALLBACK: FeatureTileProduct = {
    name: 'New Arrivals',
    slug: 'store',
    thumbnail_url: null,
    short_desc: 'Explore our latest products.',
    min_price: 0,
    nav_category: 'Trovestak Store',
};

export function FeatureTile({ product, background }: FeatureTileProps) {
    const p = product ?? FALLBACK;
    const isDark = background === 'dark' || background === 'black';
    return (
        <section
            className="relative w-full min-h-[520px] md:min-h-[680px] flex flex-col items-center overflow-hidden"
            style={{ background: BG[background] }}
        >
            {/* Text block — centered, top */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                transition={{ staggerChildren: 0.07 }}
                className="relative z-10 w-full flex flex-col items-center text-center px-5 pt-[52px] pb-8"
            >
                {p.nav_category && (
                    <motion.p
                        variants={staggerChild.variants}
                        className="text-[17px] font-semibold text-[#0071e3] mb-1.5"
                    >
                        {p.nav_category}
                    </motion.p>
                )}

                <motion.h2
                    variants={staggerChild.variants}
                    className={`text-[clamp(48px,6vw,72px)] font-semibold leading-[1.05] tracking-tight ${TEXT_COLOR[background]}`}
                >
                    {p.name}
                </motion.h2>

                {p.short_desc && (
                    <motion.p
                        variants={staggerChild.variants}
                        className={`text-[clamp(17px,2vw,24px)] leading-relaxed max-w-[560px] mt-2 ${SUBTEXT_COLOR[background]}`}
                    >
                        {p.short_desc}
                    </motion.p>
                )}

                {p.min_price && p.min_price > 0 && (
                    <motion.p
                        variants={staggerChild.variants}
                        className={`text-[17px] md:text-[19px] mt-1 ${SUBTEXT_COLOR[background]}`}
                    >
                        From {formatKES(p.min_price)}
                    </motion.p>
                )}

                {/* CTAs — pill buttons */}
                <motion.div
                    variants={staggerChild.variants}
                    className="flex flex-col sm:flex-row items-center gap-3 mt-6"
                >
                    <Link
                        href={`/products/${p.slug}#details`}
                        className={isDark ? BtnDarkOutline : BtnOutline}
                    >
                        Learn more
                    </Link>
                    <Link
                        href={`/products/${p.slug}`}
                        className={BtnBlue}
                    >
                        Shop {p.name}
                    </Link>
                </motion.div>
            </motion.div>

            {/* Image block — flex-1, centered */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative flex-1 w-full max-w-2xl mx-auto min-h-[220px] md:min-h-[340px]"
            >
                {p.thumbnail_url ? (
                    <Image
                        src={p.thumbnail_url}
                        alt={p.name}
                        fill
                        className="object-contain p-8"
                        sizes="(max-width: 768px) 100vw, 672px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-apple-border" />
                    </div>
                )}
            </motion.div>
        </section>
    );
}
