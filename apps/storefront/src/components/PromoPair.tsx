import Link from 'next/link';

interface PromoTile {
    eyebrow: string;
    headline: string;
    body: string;
    cta: string;
    href: string;
    bg: string;
    textColor: string;
    bodyColor: string;
}

const TILES: [PromoTile, PromoTile] = [
    {
        eyebrow: 'Trade In',
        headline: 'Upgrade smarter. Trade in your device.',
        body: 'Get credit toward your next device. Launching soon.',
        cta: 'Coming soon ›',
        href: '/trade-in',
        bg: '#f5f5f7',
        textColor: '#1d1d1f',
        bodyColor: '#6e6e73',
    },
    {
        eyebrow: 'TroveXP',
        headline: 'TroveXP. Earn as you shop, rise as you save.',
        body: 'Every purchase earns points. Unlock more.',
        cta: 'Coming soon ›',
        href: '/account',
        bg: '#ffffff',
        textColor: '#1d1d1f',
        bodyColor: '#6e6e73',
    },
];

export function PromoPair() {
    return (
        <section
            className="w-full grid grid-cols-1 md:grid-cols-2 bg-[#e5e5ea]"
            style={{ gap: '1px' }}
        >
            {TILES.map((tile) => (
                <div
                    key={tile.eyebrow}
                    className="flex flex-col justify-between min-h-[240px] md:min-h-[280px] p-6 md:p-12"
                    style={{ background: tile.bg }}
                >
                    {/* Top — text content */}
                    <div>
                        <p
                            className="text-[12px] font-medium uppercase tracking-widest mb-3"
                            style={{ color: '#0071e3' }}
                        >
                            {tile.eyebrow}
                        </p>
                        <h2
                            className="text-[24px] md:text-[32px] font-bold leading-[1.07] tracking-tight mb-3"
                            style={{ color: tile.textColor }}
                        >
                            {tile.headline}
                        </h2>
                        <p
                            className="text-[15px] md:text-[17px] leading-relaxed max-w-[380px]"
                            style={{ color: tile.bodyColor }}
                        >
                            {tile.body}
                        </p>
                    </div>

                    {/* Bottom — CTA */}
                    <Link
                        href={tile.href}
                        className="mt-6 text-[15px] md:text-[17px] text-[#0071e3] hover:underline self-start"
                    >
                        {tile.cta}
                    </Link>
                </div>
            ))}
        </section>
    );
}
