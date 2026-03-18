"use client";

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { HomepageTheme } from '@/lib/homepage-theme';

interface AnnouncementBannerProps {
    theme: HomepageTheme;
}

function useCountdown(deadline?: Date) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!deadline) return;

        const compute = () => {
            const diff = deadline.getTime() - Date.now();
            if (diff <= 0) { setTimeLeft(''); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
        };

        compute();
        const id = setInterval(compute, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    return timeLeft;
}

export function AnnouncementBanner({ theme }: AnnouncementBannerProps) {
    const banner = theme.banner;
    const storageKey = `trove_banner_dismissed_${theme.mode}`;
    const [visible, setVisible] = useState(false);
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;
        const dismissed = localStorage.getItem(storageKey);
        if (!dismissed) setVisible(true);
    }, [storageKey]);

    const timeLeft = useCountdown(banner?.deadline);

    if (!banner || !visible) return null;

    return (
        <div className={`relative z-[10000] flex items-center justify-center gap-3 px-4 py-2.5 text-[13px] font-medium ${banner.bg} ${banner.text}`}>
            <span>{banner.message}</span>
            {timeLeft && (
                <span className="tabular-nums opacity-80">{timeLeft}</span>
            )}
            <button
                onClick={() => {
                    setVisible(false);
                    localStorage.setItem(storageKey, '1');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss banner"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
