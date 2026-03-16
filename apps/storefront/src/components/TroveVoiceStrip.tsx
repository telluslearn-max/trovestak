"use client";

import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { scrollReveal } from '@/lib/motion';

export function TroveVoiceStrip() {
    return (
        <section className="bg-[#1d1d1f] py-20 px-6">
            <motion.div
                {...scrollReveal}
                className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10"
            >
                {/* Text */}
                <div className="text-center md:text-left max-w-lg">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(245,245,247,0.5)] mb-3">
                        TroveVoice
                    </p>
                    <h2 className="text-[40px] md:text-[52px] font-bold tracking-tight leading-[1.05] text-white mb-4">
                        Shop by Voice.
                    </h2>
                    <p className="text-[17px] text-[rgba(245,245,247,0.6)] leading-relaxed">
                        Ask TroveVoice anything — products, specs, comparisons, M-Pesa financing. Your AI shopping concierge, always on.
                    </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center gap-4">
                    {/* Pulse ring */}
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                            className="absolute inset-0 rounded-full bg-[#0071e3]/40"
                        />
                        <button
                            id="trove-voice-strip-cta"
                            className="relative w-20 h-20 rounded-full bg-[#0071e3] hover:bg-[#0077ed] transition-colors flex items-center justify-center shadow-lg"
                            aria-label="Start TroveVoice"
                        >
                            <Mic className="w-8 h-8 text-white" />
                        </button>
                    </div>
                    <p className="text-[14px] text-[rgba(245,245,247,0.5)]">Tap to start a voice session</p>
                </div>
            </motion.div>
        </section>
    );
}
