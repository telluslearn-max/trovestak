import Link from 'next/link';

export function MpesaStrip() {
    return (
        <div className="bg-white border-y border-[#d2d2d7]/60 py-3 px-4">
            <p className="text-center text-[14px] text-[#1d1d1f]">
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#10b981]" />
                    Pay over 3, 6, or 12 months with M-Pesa. No card needed.{' '}
                    <Link href="/checkout" className="text-[#0071e3] hover:underline font-medium">
                        Learn more ›
                    </Link>
                </span>
            </p>
        </div>
    );
}
