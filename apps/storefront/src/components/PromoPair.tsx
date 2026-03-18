import Link from 'next/link';

const BtnBlue = "inline-flex items-center justify-center rounded-full bg-[#0071e3] text-white text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.03]";
const BtnOutline = "inline-flex items-center justify-center rounded-full text-[#0071e3] text-[13px] font-normal px-4 py-[7px] transition-all duration-200 hover:bg-[rgba(0,113,227,0.06)]";

export function PromoPair() {
    return (
        <section className="w-full px-[10px] pb-[10px]" style={{ background: '#f5f5f7' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">

                {/* Trade-In card */}
                <div
                    className="rounded-[20px] overflow-hidden flex flex-col items-center text-center px-10 pt-[52px] min-h-[500px]"
                    style={{ background: '#f5f5f7' }}
                >
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-[#0071e3] mb-2">
                        Trade In
                    </p>
                    <h2 className="text-[34px] md:text-[38px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07] mb-2">
                        Trade In
                    </h2>
                    <p className="text-[17px] text-[#1d1d1f] mb-1 leading-[1.4]">
                        Upgrade smarter.<br />Get credit toward your next purchase.
                    </p>
                    <p className="text-[12px] text-[#6e6e73] mb-6 leading-[1.5]">
                        Launching soon.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/trade-in" className={BtnBlue}>Get your estimate</Link>
                    </div>

                    {/* Phone illustrations */}
                    <div className="flex-1 flex items-end justify-center gap-5 pt-8 pb-0">
                        <div
                            className="w-24 h-48 rounded-[24px] relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, #a8ccdc, #78a8c8)',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.5)',
                            }}
                        >
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)', borderRadius: 'inherit' }} />
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full border-[3px] border-white/30" />
                        </div>
                        <div
                            className="w-24 h-48 rounded-[24px] relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, #28282c, #1a1a1e)',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.5)',
                            }}
                        >
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)', borderRadius: 'inherit' }} />
                            <div className="absolute top-4 right-3.5 w-7 h-7 rounded-[9px]" style={{ background: 'rgba(0,0,0,0.5)' }} />
                        </div>
                    </div>
                </div>

                {/* TroveXP card */}
                <div
                    className="rounded-[20px] overflow-hidden flex flex-col items-center text-center px-10 pt-[52px] min-h-[500px]"
                    style={{ background: 'linear-gradient(160deg, #ececf0 0%, #e0e0e5 100%)' }}
                >
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-[#0071e3] mb-2">
                        TroveXP
                    </p>
                    <h2 className="text-[34px] md:text-[38px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07] mb-2">
                        TroveXP
                    </h2>
                    <p className="text-[17px] text-[#1d1d1f] mb-1 leading-[1.4]">
                        Earn as you shop, rise as you save.
                    </p>
                    <p className="text-[12px] text-[#6e6e73] mb-6 leading-[1.5]">
                        Every purchase earns points. Unlock more.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/account" className={BtnBlue}>Learn more</Link>
                        <Link href="/account" className={BtnOutline}>Join now</Link>
                    </div>

                    {/* Card illustration */}
                    <div className="flex-1 flex items-end justify-center pt-8 pb-0">
                        <div
                            className="w-72 h-44 rounded-[20px] relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #f0f0f5 0%, #e4e4ea 50%, #d8d8e0 100%)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.1), 0 24px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
                                transform: 'perspective(600px) rotateX(8deg)',
                            }}
                        >
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%, rgba(255,255,255,0.1) 100%)' }} />
                            <div className="absolute bottom-5 left-5 text-[11px] text-[#1d1d1f]/40 tracking-[0.05em]">TroveXP</div>
                            <div className="absolute bottom-5 right-5 text-[13px] text-[#1d1d1f]/30 font-medium">Rewards</div>
                            <div
                                className="absolute bottom-8 left-5 w-8 h-6 rounded"
                                style={{ background: 'linear-gradient(135deg, #d4b860, #c0a040)', border: '1px solid rgba(0,0,0,0.1)' }}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
