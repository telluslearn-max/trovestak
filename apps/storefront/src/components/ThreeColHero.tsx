"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatKES } from '@/lib/formatters';
import type { FeatureTileProduct } from './FeatureTile';

const BtnBlue = "inline-flex items-center justify-center rounded-full bg-[#0071e3] text-white text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.03]";
const BtnOutline = "inline-flex items-center justify-center rounded-full text-[#0071e3] text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[rgba(0,113,227,0.06)]";

interface ThreeColHeroProps {
    product: FeatureTileProduct | null;
}

const FALLBACK: FeatureTileProduct = {
    name: 'Trovestak Store',
    slug: 'store',
    thumbnail_url: null,
    short_desc: "Kenya's Best Electronics",
    min_price: 0,
    nav_category: 'Electronics',
};

export function ThreeColHero({ product }: ThreeColHeroProps) {
    const p = product ?? FALLBACK;
    return (
        <section
            className="relative w-full overflow-hidden"
            style={{ minHeight: 480, background: '#fafaf8' }}
        >
            {/* Desktop: 3-column grid. Mobile: single centered column */}
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]" style={{ minHeight: 480 }}>

                {/* Left wing — warm gradient, hidden on mobile */}
                <div
                    className="hidden md:block"
                    style={{ background: 'linear-gradient(135deg, #f8ede0 0%, #f0d8c8 100%)' }}
                />

                {/* Center column — content + image */}
                <div
                    className="flex flex-col items-center justify-center text-center px-10 py-14 md:py-16"
                    style={{ background: '#fafaf8', minWidth: 340 }}
                >
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        className="flex flex-col items-center"
                    >
                        {p.nav_category && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.05, duration: 0.45 }}
                                className="text-[12px] font-semibold uppercase tracking-widest mb-2 text-apple-blue"
                            >
                                {p.nav_category}
                            </motion.p>
                        )}

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="text-[52px] font-semibold leading-[1.05] tracking-tight text-apple-text"
                        >
                            {p.name}
                        </motion.h2>

                        {p.short_desc && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.15, duration: 0.45 }}
                                className="text-[21px] text-apple-text mt-2 mb-1"
                            >
                                {p.short_desc}
                            </motion.p>
                        )}

                        {p.min_price && p.min_price > 0 && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.18, duration: 0.4 }}
                                className="text-[12px] text-apple-text-tertiary mb-6 leading-relaxed"
                            >
                                From {formatKES(p.min_price)}
                            </motion.p>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.22, duration: 0.4 }}
                            className="flex gap-3 justify-center"
                        >
                            <Link href={`/products/${p.slug}#details`} className={BtnOutline}>
                                Learn more
                            </Link>
                            <Link href={`/products/${p.slug}`} className={BtnBlue}>
                                Shop now
                            </Link>
                        </motion.div>

                        {/* Product image */}
                        {p.thumbnail_url && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                                className="relative w-[220px] h-[220px] mt-8"
                            >
                                <Image
                                    src={p.thumbnail_url}
                                    alt={p.name}
                                    fill
                                    className="object-contain"
                                    sizes="220px"
                                />
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Right wing — cool gradient, hidden on mobile */}
                <div
                    className="hidden md:block"
                    style={{ background: 'linear-gradient(225deg, #e8e0f0 0%, #d8cce8 100%)' }}
                />
            </div>
        </section>
    );
}
