"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const CATEGORIES = [
    { slug: 'mobile', name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' },
    { slug: 'computing', name: 'Laptops', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
    { slug: 'tablets', name: 'Tablets', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80' },
    { slug: 'audio', name: 'Audio', image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80' },
    { slug: 'gaming', name: 'Gaming', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80' },
    { slug: 'cameras', name: 'Cameras', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80' },
    { slug: 'wearables', name: 'Wearables', image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80' },
    { slug: 'smart-home', name: 'Smart Home', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80' },
    { slug: 'store', name: 'All Products', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80' },
];

export function CategoryGrid() {
    return (
        <section className="bg-[#f5f5f7] border-t border-[#d2d2d7]/40 py-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-6"
            >
                <div className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
                    {CATEGORIES.map((cat, i) => (
                        <motion.div
                            key={cat.slug}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.4 }}
                            className="flex-none snap-start"
                        >
                            <Link
                                href={cat.slug === 'store' ? '/store' : `/category/${cat.slug}`}
                                className="group flex flex-col items-center gap-2 w-[90px]"
                            >
                                <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-shadow duration-200">
                                    <Image
                                        src={cat.image}
                                        alt={cat.name}
                                        fill
                                        className="object-cover group-hover:scale-[1.06] transition-transform duration-300"
                                        sizes="72px"
                                    />
                                </div>
                                <span className="text-[12px] font-medium text-[#1d1d1f] text-center leading-tight group-hover:text-[#0071e3] transition-colors">
                                    {cat.name}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
