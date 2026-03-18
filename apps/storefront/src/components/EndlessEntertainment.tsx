"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

function MediaCard({
    label,
    title,
    sub,
    cta,
    href,
    bg,
}: {
    label: string;
    title: string;
    sub?: string;
    cta: string;
    href: string;
    bg: string;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.04, y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="rounded-[16px] min-h-[200px] relative overflow-hidden cursor-pointer"
            style={{ background: bg }}
        >
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center gap-1 z-10 text-[11px] font-bold text-white">
                {label}
            </div>
            <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10">
                {title && <div className="text-[12px] font-semibold text-white">{title}</div>}
                {sub && <div className="text-[10px] text-white/70 mt-0.5">{sub}</div>}
                <Link
                    href={href}
                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-white/30 transition-all duration-200"
                >
                    {cta} ›
                </Link>
            </div>
        </motion.div>
    );
}

export function EndlessEntertainment() {
    return (
        <section className="bg-black pt-20 overflow-hidden">
            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-white text-center font-semibold tracking-tight mb-[50px]"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
            >
                Endless entertainment.
            </motion.h2>

            {/* 3-column feature grid */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="grid gap-[10px] px-[10px] mb-[10px]"
                style={{ gridTemplateColumns: '0.9fr 2fr 1.4fr' }}
            >
                {/* Yellow TroveVoice card */}
                <div
                    className="rounded-[20px] min-h-[340px] flex flex-col justify-between p-7 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                    style={{ background: '#ffe600' }}
                >
                    <div className="flex items-center gap-2">
                        <svg width="20" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="8" r="4" fill="#000" />
                            <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className="text-[22px] font-bold text-black tracking-tight">TroveVoice</span>
                    </div>
                    <div
                        className="text-black font-black leading-none tracking-[-3px]"
                        style={{ fontSize: 72 }}
                    >
                        AI
                    </div>
                </div>

                {/* Dark film / featured card */}
                <div
                    className="rounded-[20px] min-h-[340px] relative overflow-hidden flex items-end p-6 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(40,70,120,0.6) 0%, transparent 60%), linear-gradient(180deg, #0a0e1a, #050810)',
                    }}
                >
                    {/* Silhouette decoration */}
                    <svg
                        className="absolute bottom-0 left-1/2 -translate-x-1/2"
                        width="160" height="220" viewBox="0 0 160 220" fill="none"
                        style={{ opacity: 0.7 }}
                    >
                        <ellipse cx="80" cy="210" rx="60" ry="10" fill="rgba(0,0,0,0.5)" />
                        <circle cx="80" cy="60" r="28" fill="#0a0e18" />
                        <path d="M52 100 Q80 88 108 100 L112 180 Q80 188 48 180 Z" fill="#0a0e18" />
                        <line x1="52" y1="110" x2="28" y2="160" stroke="#0a0e18" strokeWidth="14" strokeLinecap="round" />
                        <line x1="108" y1="110" x2="132" y2="160" stroke="#0a0e18" strokeWidth="14" strokeLinecap="round" />
                    </svg>
                    <div className="relative z-10 text-white">
                        <div className="flex items-center gap-1.5 text-[11px] opacity-70 mb-1.5">
                            <svg width="12" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                            </svg>
                            Trovestak Store
                        </div>
                        <div className="text-[18px] font-semibold">New Arrivals · Now Live</div>
                    </div>
                </div>

                {/* Dark blue night card */}
                <div
                    className="rounded-[20px] min-h-[340px] flex flex-col justify-between p-7 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
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
            </motion.div>

            {/* 5-column media row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-5 gap-[10px] px-[10px]"
            >
                <MediaCard
                    label="Gaming"
                    title="New Releases"
                    cta="Shop now"
                    href="/category/gaming"
                    bg="linear-gradient(135deg, #ff6b35 0%, #ff3366 60%, #cc1144 100%)"
                />
                <MediaCard
                    label="Smart TVs"
                    title='Up to 75" 4K'
                    sub="Samsung · LG · Sony"
                    cta="Shop TVs"
                    href="/category/smart-home/smart-tvs"
                    bg="radial-gradient(ellipse at 50% 0%, rgba(40,80,160,0.8) 0%, transparent 60%), linear-gradient(160deg, #0a1428, #0a0a14)"
                />
                <MediaCard
                    label="Audio"
                    title="Premium Sound"
                    sub="Headphones & Speakers"
                    cta="Listen now"
                    href="/category/audio"
                    bg="linear-gradient(145deg, #fc3c44 0%, #c41028 100%)"
                />
                <MediaCard
                    label="Smart Home"
                    title="Connected Living"
                    cta="Explore"
                    href="/category/smart-home"
                    bg="linear-gradient(160deg, #1c1c1e, #2c2c2e)"
                />
                <MediaCard
                    label="Deals"
                    title="New arrivals"
                    cta="Shop deals"
                    href="/deals"
                    bg="linear-gradient(135deg, #1a1060 0%, #4a1880 60%, #6020a0 100%)"
                />
            </motion.div>

            {/* Dot nav */}
            <div className="flex gap-[6px] justify-center py-6">
                <div className="w-[7px] h-[7px] rounded-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.7)' }} />
                <div className="w-[7px] h-[7px] rounded-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="w-[7px] h-[7px] rounded-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="w-[7px] h-[7px] rounded-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>
        </section>
    );
}
