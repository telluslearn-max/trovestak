"use client";

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

interface GalleryCard {
    label: string;
    title: string;
    sub?: string;
    cta: string;
    href: string;
    bg: string;
}

interface Tab {
    id: string;
    label: string;
    cards: GalleryCard[];
}

// ── Tab data ───────────────────────────────────────────────────────────────

const TABS: Tab[] = [
    {
        id: 'phones',
        label: 'Phones',
        cards: [
            { label: 'Flagship', title: 'iPhone 16 Pro', sub: 'Titanium. Powerful.', cta: 'Shop now', href: '/category/mobile/flagship-phones/apple', bg: 'linear-gradient(145deg, #1c1c1e 0%, #2d2d30 60%, #1a1a1c 100%)' },
            { label: 'Android', title: 'Samsung Galaxy S25', sub: 'AI-powered photography', cta: 'Shop now', href: '/category/mobile/flagship-phones/samsung', bg: 'linear-gradient(145deg, #0a1628, #1a3060)' },
            { label: 'Google', title: 'Pixel 9 Pro', sub: 'Pure Android experience', cta: 'Shop now', href: '/category/mobile/flagship-phones/google', bg: 'linear-gradient(145deg, #1a3a1a, #2a5a2a)' },
            { label: 'Mid-Range', title: 'Under KES 30K', sub: 'Samsung · Xiaomi · OPPO', cta: 'Explore', href: '/category/mobile/mid-range-phones', bg: 'linear-gradient(145deg, #2a1a3a, #4a2a6a)' },
            { label: 'Budget', title: 'Smart picks', sub: 'Infinix · Tecno · itel', cta: 'Shop now', href: '/category/mobile/budget-phones', bg: 'linear-gradient(145deg, #3a2010, #6a4020)' },
        ],
    },
    {
        id: 'laptops',
        label: 'Laptops',
        cards: [
            { label: 'Apple', title: 'MacBook Air M3', sub: 'Thin. Light. Fast.', cta: 'Shop now', href: '/category/computers/laptops/apple', bg: 'linear-gradient(145deg, #c8d8e8, #8aacc8)' },
            { label: 'Windows', title: 'Dell XPS 15', sub: 'Premium performance', cta: 'Shop now', href: '/category/computers/laptops/dell', bg: 'linear-gradient(145deg, #1a1a2e, #16213e)' },
            { label: 'Gaming', title: 'ASUS ROG', sub: 'Dominate every game', cta: 'Shop now', href: '/category/computers/gaming-laptops', bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a0028 60%, #2a003a 100%)' },
            { label: 'Business', title: 'ThinkPad Series', sub: 'Built for the boardroom', cta: 'Explore', href: '/category/computers/laptops/lenovo', bg: 'linear-gradient(145deg, #0a1420, #0a2030)' },
            { label: 'Budget', title: 'Under KES 60K', sub: 'HP · Acer · Lenovo', cta: 'Shop now', href: '/category/computers/laptops', bg: 'linear-gradient(145deg, #1a2a1a, #2a4a2a)' },
        ],
    },
    {
        id: 'audio',
        label: 'Audio',
        cards: [
            { label: 'Over-Ear', title: 'Sony WH-1000XM5', sub: 'Industry-best ANC', cta: 'Listen now', href: '/category/audio/over-ear-headphones', bg: 'linear-gradient(145deg, #1a0a0a, #3a1010)' },
            { label: 'Earbuds', title: 'AirPods Pro 2', sub: 'Adaptive audio', cta: 'Listen now', href: '/category/audio/wireless-earbuds/apple', bg: 'linear-gradient(145deg, #f0f0f2, #d8d8dc)' },
            { label: 'Speakers', title: 'JBL Charge 6', sub: 'Waterproof. Loud.', cta: 'Shop now', href: '/category/audio/bluetooth-speakers', bg: 'linear-gradient(135deg, #fc3c44 0%, #c41028 100%)' },
            { label: 'Soundbars', title: 'Samsung HW-Q990D', sub: '11.1.4ch Dolby Atmos', cta: 'Shop now', href: '/category/audio/soundbars', bg: 'linear-gradient(145deg, #0a1428, #142040)' },
            { label: 'Studio', title: 'Pro Audio Gear', sub: 'Record. Mix. Master.', cta: 'Explore', href: '/category/audio/studio-equipment', bg: 'linear-gradient(160deg, #1c1c1e, #2c2c2e)' },
        ],
    },
    {
        id: 'gaming',
        label: 'Gaming',
        cards: [
            { label: 'Consoles', title: 'PlayStation 5', sub: 'Play has no limits', cta: 'Shop now', href: '/category/gaming/consoles', bg: 'linear-gradient(145deg, #003087, #0050d0)' },
            { label: 'Xbox', title: 'Xbox Series X', sub: 'The most powerful Xbox', cta: 'Shop now', href: '/category/gaming/consoles', bg: 'linear-gradient(145deg, #0a1a0a, #107010)' },
            { label: 'Accessories', title: 'Controllers & Gear', sub: 'Level up your setup', cta: 'Shop now', href: '/category/gaming/accessories', bg: 'linear-gradient(135deg, #ff6b35 0%, #ff3366 60%, #cc1144 100%)' },
            { label: 'Gaming Phones', title: 'ASUS ROG Phone', sub: 'Built for mobile gaming', cta: 'Play now', href: '/category/mobile/gaming-phones', bg: 'linear-gradient(135deg, #1a1060 0%, #4a1880 60%, #6020a0 100%)' },
            { label: 'Monitors', title: '165Hz Gaming', sub: 'Zero blur. Pure speed.', cta: 'Explore', href: '/category/computers/gaming-monitors', bg: 'linear-gradient(145deg, #0a0a14, #14142a)' },
        ],
    },
    {
        id: 'smart-tvs',
        label: 'Smart TVs',
        cards: [
            { label: 'Samsung QLED', title: 'Neo QLED 8K', sub: 'Beyond reality', cta: 'Shop now', href: '/category/smart-home/smart-tvs/samsung', bg: 'radial-gradient(ellipse at 50% 0%, rgba(40,80,160,0.8) 0%, transparent 60%), linear-gradient(160deg, #0a1428, #0a0a14)' },
            { label: 'LG OLED', title: 'LG C4 OLED', sub: 'Perfect black. Infinite contrast.', cta: 'Shop now', href: '/category/smart-home/smart-tvs/lg', bg: 'linear-gradient(145deg, #0a0a0a, #1a0a28)' },
            { label: 'Sony Bravia', title: 'Sony XR A95L', sub: 'Cognitive processor XR', cta: 'Shop now', href: '/category/smart-home/smart-tvs/sony', bg: 'linear-gradient(145deg, #0a1414, #0a2828)' },
            { label: 'Budget', title: 'Under KES 50K', sub: 'TCL · Hisense · Skyworth', cta: 'Explore', href: '/category/smart-home/smart-tvs', bg: 'linear-gradient(145deg, #1a1a2e, #2a2a4e)' },
            { label: 'Projectors', title: 'Home Cinema', sub: '4K · Short-throw', cta: 'Shop now', href: '/category/smart-home/projectors', bg: 'linear-gradient(145deg, #1a0a28, #2a1040)' },
        ],
    },
    {
        id: 'deals',
        label: 'Deals',
        cards: [
            { label: 'Flash Sale', title: 'Up to 40% off', sub: 'Limited time only', cta: 'Shop deals', href: '/deals', bg: 'linear-gradient(135deg, #ff6b35 0%, #ff3366 60%, #cc1144 100%)' },
            { label: 'Bundles', title: 'Phone + Earbuds', sub: 'Buy together, save more', cta: 'See bundles', href: '/deals/bundles', bg: 'linear-gradient(145deg, #1a3060, #0a1a40)' },
            { label: 'Refurbished', title: 'Certified Pre-Owned', sub: 'Like new. Lower price.', cta: 'Explore', href: '/deals/refurbished', bg: 'linear-gradient(145deg, #1a2a1a, #2a4a2a)' },
            { label: 'Weekly', title: 'New deals weekly', sub: 'Check back every Monday', cta: 'View all', href: '/deals/weekly', bg: 'linear-gradient(135deg, #1a1060 0%, #4a1880 60%, #6020a0 100%)' },
            { label: 'Trade In', title: 'Get KES 5K–30K', sub: 'Trade your old device', cta: 'Get estimate', href: '/trade-in', bg: 'linear-gradient(160deg, #1c1c1e, #2c2c2e)' },
        ],
    },
];

// ── MediaCard ──────────────────────────────────────────────────────────────

function MediaCard({ card }: { card: GalleryCard }) {
    return (
        <Link
            href={card.href}
            className="group rounded-[16px] min-h-[200px] relative overflow-hidden block"
            style={{ background: card.bg }}
        >
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center gap-1 z-10 text-[11px] font-bold text-white/80 uppercase tracking-[0.06em]">
                {card.label}
            </div>
            <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10">
                {card.title && (
                    <div className="text-[12px] font-semibold text-white leading-tight">{card.title}</div>
                )}
                {card.sub && (
                    <div className="text-[10px] text-white/60 mt-0.5">{card.sub}</div>
                )}
                <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full group-hover:bg-white/30 transition-all duration-200">
                    {card.cta} ›
                </span>
            </div>
            {/* hover overlay */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-[16px]" />
        </Link>
    );
}

// ── EndlessEntertainment ───────────────────────────────────────────────────

export function EndlessEntertainment() {
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0];

    return (
        <section className="bg-black pt-20 pb-8 overflow-hidden">

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-white text-center font-semibold tracking-tight mb-[50px] px-5"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
            >
                Endless entertainment.
            </motion.h2>

            {/* 3-column feature hero grid */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="px-[10px] mb-[10px]"
            >
                {/* Desktop: 3-col asymmetric */}
                <div className="hidden md:grid gap-[10px]" style={{ gridTemplateColumns: '0.9fr 2fr 1.4fr' }}>
                    <FeatureCardVoice />
                    <FeatureCardFilm />
                    <FeatureCardShop />
                </div>
                {/* Mobile: single column */}
                <div className="flex flex-col gap-[10px] md:hidden">
                    <FeatureCardVoice />
                    <FeatureCardFilm />
                    <FeatureCardShop />
                </div>
            </motion.div>

            {/* Tab navigation */}
            <div className="px-[10px] mb-4">
                <div
                    className="flex overflow-x-auto gap-1 scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-none text-[13px] font-medium px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-white text-black'
                                    : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="px-[10px]"
                >
                    {/* Desktop: 5-column grid */}
                    <div className="hidden md:grid grid-cols-5 gap-[10px]">
                        {currentTab.cards.map((card, i) => (
                            <MediaCard key={i} card={card} />
                        ))}
                    </div>

                    {/* Mobile: 2-column grid */}
                    <div className="grid grid-cols-2 gap-[10px] md:hidden">
                        {currentTab.cards.map((card, i) => (
                            <MediaCard key={i} card={card} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

        </section>
    );
}

// ── Feature hero cards (above tab gallery) ────────────────────────────────

function FeatureCardVoice() {
    return (
        <div
            className="rounded-[20px] min-h-[280px] md:min-h-[340px] flex flex-col justify-between p-7 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            style={{ background: '#ffe600' }}
        >
            <div className="flex items-center gap-2">
                {/* mic icon */}
                <svg width="20" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3" fill="#000" />
                    <path d="M5 10a7 7 0 0014 0" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="17" x2="12" y2="21" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-[22px] font-bold text-black tracking-tight">TroveVoice</span>
            </div>
            <div>
                <div className="text-black font-black leading-none tracking-[-3px] mb-3" style={{ fontSize: 'clamp(48px,8vw,72px)' }}>
                    AI
                </div>
                <div className="text-black/60 text-[13px] font-medium">
                    Shop by voice. Powered by Gemini.
                </div>
            </div>
        </div>
    );
}

function FeatureCardFilm() {
    return (
        <div
            className="rounded-[20px] min-h-[280px] md:min-h-[340px] relative overflow-hidden flex items-end p-6 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(40,70,120,0.6) 0%, transparent 60%), linear-gradient(180deg, #0a0e1a, #050810)',
            }}
        >
            {/* Decorative silhouette */}
            <svg
                className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                width="160" height="220" viewBox="0 0 160 220" fill="none"
                style={{ opacity: 0.5 }}
            >
                <ellipse cx="80" cy="210" rx="60" ry="10" fill="rgba(0,0,0,0.5)" />
                <circle cx="80" cy="60" r="28" fill="#0a0e18" />
                <path d="M52 100 Q80 88 108 100 L112 180 Q80 188 48 180 Z" fill="#0a0e18" />
                <line x1="52" y1="110" x2="28" y2="160" stroke="#0a0e18" strokeWidth="14" strokeLinecap="round" />
                <line x1="108" y1="110" x2="132" y2="160" stroke="#0a0e18" strokeWidth="14" strokeLinecap="round" />
            </svg>
            <div className="relative z-10 text-white">
                <div className="text-[11px] text-white/50 uppercase tracking-[0.08em] mb-1.5">
                    Trovestak Store
                </div>
                <div className="text-[18px] font-semibold mb-3">New Arrivals · Now Live</div>
                <Link
                    href="/store"
                    className="inline-flex items-center gap-2 rounded-full text-white text-[13px] border border-white/30 px-4 py-[7px] backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                    {/* play icon */}
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                        <path d="M0 0l10 6-10 6V0z" />
                    </svg>
                    Shop now
                </Link>
            </div>
        </div>
    );
}

function FeatureCardShop() {
    return (
        <div
            className="rounded-[20px] min-h-[280px] md:min-h-[340px] flex flex-col justify-between p-7 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            style={{
                background: 'radial-gradient(ellipse at 60% 20%, rgba(20,80,180,0.5) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(80,20,120,0.3) 0%, transparent 50%), linear-gradient(160deg, #0a1428, #14102a)',
            }}
        >
            <div className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.08em]">
                Trovestak Originals
            </div>
            <div>
                <div className="text-[22px] font-semibold text-white leading-[1.2] mb-3">
                    Shop anywhere.<br />Find everything.
                </div>
                <Link
                    href="/store"
                    className="inline-flex items-center justify-center rounded-full text-white text-[13px] border border-white/30 px-4 py-[7px] backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                    Shop now
                </Link>
            </div>
        </div>
    );
}
