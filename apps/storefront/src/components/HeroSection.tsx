"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatKES } from '@/lib/formatters';
import type { HomepageTheme } from '@/lib/homepage-theme';

interface HeroProduct {
    name: string;
    slug: string;
    thumbnail_url: string | null;
    short_desc?: string | null;
    min_price?: number;
    nav_category?: string | null;
}

interface HeroSectionProps {
    product?: HeroProduct | null;
    theme: HomepageTheme;
}

const DELAY = [0.05, 0.13, 0.20, 0.27, 0.32];

export function HeroSection({ product, theme }: HeroSectionProps) {
    const isDark = theme.palette === 'dark';

    const eyebrow = theme.hero?.eyebrow ?? product?.nav_category ?? 'Trovestak Store';
    const headline = product?.name ?? "Kenya's Best Electronics Store";
    const subline = (() => {
        if (!product?.short_desc) return 'Genuine products. AI guidance. Zero risk.';
        return product.short_desc.length <= 80
            ? product.short_desc
            : product.short_desc.slice(0, product.short_desc.lastIndexOf(' ', 80)) || product.short_desc.slice(0, 80);
    })();

    const productHref = product ? `/products/${product.slug}` : '/store';

    return (
        <section
            className="relative w-full min-h-[600px] md:min-h-[680px] flex flex-col items-center overflow-hidden"
            style={{ background: isDark ? '#000000' : '#ffffff' }}
        >
            {/* Text block — top, centered */}
            <div className="relative z-10 w-full flex flex-col items-center text-center px-6 pt-16 md:pt-20 pb-8">
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: DELAY[0], duration: 0.45 }}
                    className={`text-[12px] font-medium uppercase tracking-widest mb-3 ${isDark ? 'text-apple-blue' : 'text-apple-blue'}`}
                >
                    {eyebrow}
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: DELAY[1], duration: 0.5 }}
                    className={`text-[48px] md:text-[56px] font-bold leading-[1.05] tracking-tight ${isDark ? 'text-white' : 'text-apple-text'}`}
                >
                    {headline}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: DELAY[2], duration: 0.5 }}
                    className={`text-[19px] leading-relaxed max-w-[500px] mt-3 ${isDark ? 'text-white/60' : 'text-apple-text-tertiary'}`}
                >
                    {subline}
                </motion.p>

                {product?.min_price && product.min_price > 0 && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: DELAY[3], duration: 0.45 }}
                        className={`text-[19px] mt-1 ${isDark ? 'text-white/50' : 'text-apple-text-tertiary'}`}
                    >
                        From {formatKES(product.min_price)}
                    </motion.p>
                )}

                {/* CTAs — text links only, Apple style */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: DELAY[4], duration: 0.45 }}
                    className="flex items-center gap-6 mt-6"
                >
                    <Link
                        href={`${productHref}#details`}
                        className="text-[19px] text-apple-blue hover:underline"
                    >
                        {theme.hero?.secondaryCta ? `${theme.hero.secondaryCta} ›` : 'Learn more ›'}
                    </Link>
                    <Link
                        href={productHref}
                        className="text-[19px] text-apple-blue hover:underline"
                    >
                        {theme.hero?.primaryCta ? `${theme.hero.primaryCta} ›` : (product ? `Shop ${product.name} ›` : 'Shop now ›')}
                    </Link>
                </motion.div>
            </div>

            {/* Image block — flex-1, centered, bottom of tile */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative flex-1 w-full max-w-2xl mx-auto min-h-[260px] md:min-h-[340px]"
            >
                {product?.thumbnail_url ? (
                    <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        priority
                        className="object-contain p-8"
                        sizes="(max-width: 768px) 100vw, 672px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-white/5" />
                    </div>
                )}
            </motion.div>
        </section>
    );
}
