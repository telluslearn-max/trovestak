"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { scrollReveal } from '@/lib/motion';

const CATEGORIES = [
    { slug: 'mobile', name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80' },
    { slug: 'computing', name: 'Laptops', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80' },
    { slug: 'audio', name: 'Audio', image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80' },
    { slug: 'gaming', name: 'Gaming', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80' },
    { slug: 'cameras', name: 'Cameras', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80' },
    { slug: 'wearables', name: 'Wearables', image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&q=80' },
    { slug: 'smart-home', name: 'Smart Home', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80' },
    { slug: 'store', name: 'All Products', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80' },
];

export function CategoryGrid() {
    return (
        <section className="px-4 py-20 bg-[#f5f5f7]">
            <motion.div {...scrollReveal} className="max-w-7xl mx-auto">
                <h2 className="text-[32px] font-semibold text-[#1d1d1f] mb-10 text-center">Shop by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={cat.slug === 'store' ? '/store' : `/category/${cat.slug}`}
                            className="group relative aspect-square rounded-2xl overflow-hidden bg-white"
                        >
                            <Image
                                src={cat.image}
                                alt={cat.name}
                                fill
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <p className="absolute bottom-4 left-4 text-white text-base font-semibold">
                                {cat.name}
                            </p>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
