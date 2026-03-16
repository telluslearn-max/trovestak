"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface HeroProduct {
    name: string;
    slug: string;
    thumbnail_url: string | null;
    short_desc?: string | null;
    min_price?: number;
}

interface HeroSectionProps {
    product?: HeroProduct | null;
}

export function HeroSection({ product }: HeroSectionProps) {
    return (
        <section className="bg-[#f5f5f7] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row items-center gap-12 min-h-[60vh]">
                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.5 }}
                        className="text-sm font-semibold uppercase tracking-[0.18em] text-[#86868b] mb-4"
                    >
                        Trovestak Store
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.55 }}
                        className="text-[48px] md:text-[64px] font-bold tracking-tight leading-[1.05] text-[#1d1d1f] mb-5"
                    >
                        The best way to buy<br className="hidden md:block" /> premium electronics<br className="hidden md:block" /> in Kenya.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22, duration: 0.55 }}
                        className="text-[18px] text-[#6e6e73] mb-8 max-w-md"
                    >
                        Shop by voice, pay with M-Pesa, delivered across Kenya.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-center md:items-start gap-3"
                    >
                        <Link
                            href="/store"
                            className="px-8 py-3 bg-[#0071e3] text-white text-[17px] font-medium rounded-full hover:bg-[#0077ed] transition-colors"
                        >
                            Shop now
                        </Link>
                        <button
                            id="trove-voice-cta"
                            className="inline-flex items-center gap-2 px-8 py-3 border border-[#1d1d1f]/20 text-[#1d1d1f] text-[17px] font-medium rounded-full hover:bg-[#1d1d1f]/5 transition-colors"
                        >
                            <Mic className="w-4 h-4" />
                            Talk to TroveVoice
                        </button>
                    </motion.div>
                </div>

                {/* Product image — most recently featured product */}
                {product?.thumbnail_url && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex-1 flex justify-center md:justify-end"
                    >
                        <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px]">
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                priority
                                className="object-contain"
                                sizes="(max-width: 768px) 320px, 420px"
                            />
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
