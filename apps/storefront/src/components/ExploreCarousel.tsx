"use client";

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Monitor, Headphones, Gamepad2, Camera, Watch, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface CarouselCard {
    id: string;
    label: string;
    cta: string;
    href: string;
    bg: string;
    textColor: string;
    Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const CARDS: CarouselCard[] = [
    {
        id: 'mobile',
        label: 'Mobile',
        cta: 'Shop ›',
        href: '/category/mobile',
        bg: '#e8f4ff',
        textColor: '#1d1d1f',
        Icon: Smartphone,
    },
    {
        id: 'computing',
        label: 'Computing',
        cta: 'Shop ›',
        href: '/category/computing',
        bg: '#f0f0f5',
        textColor: '#1d1d1f',
        Icon: Monitor,
    },
    {
        id: 'audio',
        label: 'Audio',
        cta: 'Shop ›',
        href: '/category/audio',
        bg: '#fff0e8',
        textColor: '#1d1d1f',
        Icon: Headphones,
    },
    {
        id: 'gaming',
        label: 'Gaming',
        cta: 'Shop ›',
        href: '/category/gaming',
        bg: '#f0e8ff',
        textColor: '#1d1d1f',
        Icon: Gamepad2,
    },
    {
        id: 'cameras',
        label: 'Cameras',
        cta: 'Shop ›',
        href: '/category/cameras',
        bg: '#e8ffe8',
        textColor: '#1d1d1f',
        Icon: Camera,
    },
    {
        id: 'wearables',
        label: 'Wearables',
        cta: 'Shop ›',
        href: '/category/wearables',
        bg: '#fff8e0',
        textColor: '#1d1d1f',
        Icon: Watch,
    },
    {
        id: 'deals',
        label: 'Deals',
        cta: 'See deals ›',
        href: '/deals',
        bg: '#ffe8e8',
        textColor: '#1d1d1f',
        Icon: Tag,
    },
];

export function ExploreCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' });
    };

    return (
        <section className="bg-[#000000] py-12 md:py-16 overflow-hidden">
            <div className="max-w-[980px] mx-auto px-4 md:px-6">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5 }}
                    className="text-[28px] md:text-[32px] font-semibold text-white mb-6"
                >
                    Explore Trovestak.
                </motion.h2>

                <div className="relative">
                    {/* Scroll container */}
                    <div
                        ref={scrollRef}
                        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {CARDS.map((card) => (
                            <Link
                                key={card.id}
                                href={card.href}
                                className="group snap-start shrink-0 w-[160px] sm:w-[190px] h-[240px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
                                style={{ background: card.bg }}
                            >
                                {/* Icon area — top 60% */}
                                <div className="flex-1 flex items-center justify-center">
                                    <card.Icon
                                        className="w-12 h-12 opacity-80 transition-opacity group-hover:opacity-100"
                                        style={{ color: card.textColor }}
                                    />
                                </div>

                                {/* Label + CTA — bottom */}
                                <div className="px-4 pb-5">
                                    <p
                                        className="text-[14px] font-semibold leading-tight"
                                        style={{ color: card.textColor }}
                                    >
                                        {card.label}
                                    </p>
                                    <p className="text-[12px] text-apple-blue mt-1 group-hover:underline">
                                        {card.cta}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Prev/Next arrows — desktop only */}
                    <button
                        onClick={() => scroll('left')}
                        className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center hover:bg-[rgba(255,255,255,0.25)] transition-colors z-10"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center hover:bg-[rgba(255,255,255,0.25)] transition-colors z-10"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </section>
    );
}
