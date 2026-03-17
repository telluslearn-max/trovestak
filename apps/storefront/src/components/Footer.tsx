"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const COLUMNS = [
    {
        title: "Shop and Learn",
        links: [
            { label: "Mobile Phones", href: "/category/mobile" },
            { label: "Computing", href: "/category/computing" },
            { label: "Tablets", href: "/category/tablets" },
            { label: "Audio", href: "/category/audio" },
            { label: "Gaming", href: "/category/gaming" },
            { label: "Cameras", href: "/category/cameras" },
            { label: "Wearables", href: "/category/wearables" },
            { label: "Smart Home", href: "/category/smart-home" },
            { label: "Deals", href: "/deals" },
        ],
    },
    {
        title: "Payments",
        links: [
            { label: "M-Pesa Lipa Na", href: "/payments/mpesa" },
            { label: "M-Pesa Fuliza", href: "/payments/fuliza" },
            { label: "3-Month Installments", href: "/payments/installments" },
            { label: "6-Month Installments", href: "/payments/installments" },
            { label: "12-Month Installments", href: "/payments/installments" },
            { label: "Trade-In Program", href: "/trade-in" },
        ],
    },
    {
        title: "Trovestak Store",
        links: [
            { label: "Find a Product", href: "/store" },
            { label: "Today at Trovestak", href: "/store" },
            { label: "Deals", href: "/deals" },
            { label: "TroveVoice", href: "/#trove-voice-cta" },
            { label: "Order Status", href: "/orders/track" },
            { label: "Shopping Help", href: "/support" },
        ],
    },
    {
        title: "Support",
        links: [
            { label: "Help Center", href: "/support" },
            { label: "Track Order", href: "/orders/track" },
            { label: "Returns & Refunds", href: "/returns" },
            { label: "Warranty Information", href: "/warranty" },
            { label: "Contact Us", href: "/contact" },
            { label: "WhatsApp Support", href: "https://wa.me/254700000000" },
        ],
    },
    {
        title: "About Trovestak",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Newsroom", href: "/blog" },
            { label: "Careers", href: "/careers" },
            { label: "TikTok", href: "https://tiktok.com/@trovestak" },
            { label: "Twitter / X", href: "https://x.com/trovestak" },
            { label: "Instagram", href: "https://instagram.com/trovestak" },
            { label: "Medium", href: "https://medium.com/trovestak" },
            { label: "WhatsApp", href: "https://wa.me/254700000000" },
        ],
    },
];

const LEGAL_LINKS = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Cookie Policy", href: "/privacy#cookies" },
    { label: "Sales & Refunds", href: "/returns" },
    { label: "Legal", href: "/terms" },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-[#D2D2D7] sm:border-none">
            {/* Mobile: accordion header */}
            <button
                className="w-full flex items-center justify-between py-3 text-left sm:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="text-[12px] font-semibold text-[#1d1d1f]">{title}</span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-[#6e6e73] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Desktop: always visible header */}
            <p className="hidden sm:block text-[12px] font-semibold text-[#1d1d1f] mb-3">{title}</p>

            {/* Links — hidden on mobile unless open */}
            <ul className={`space-y-2 pb-3 sm:pb-0 ${open ? 'block' : 'hidden sm:block'}`}>
                {links.map((link) => (
                    <li key={link.href + link.label}>
                        <Link
                            href={link.href}
                            className="text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors leading-relaxed"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#F5F5F7]">
            {/* Top divider */}
            <div className="max-w-[980px] mx-auto border-t border-[#D2D2D7]" />

            {/* Main columns */}
            <div className="max-w-[980px] mx-auto px-4 md:px-6 py-6 md:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-0 sm:gap-8">
                    {COLUMNS.map((col) => (
                        <FooterColumn key={col.title} title={col.title} links={col.links} />
                    ))}
                </div>
            </div>

            {/* Legal bar */}
            <div className="max-w-[980px] mx-auto border-t border-[#D2D2D7]" />
            <div className="max-w-[980px] mx-auto px-4 md:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-[12px] text-[#6e6e73]">
                        Copyright © {currentYear} Trovestak Ltd. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {LEGAL_LINKS.map((link) => (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
