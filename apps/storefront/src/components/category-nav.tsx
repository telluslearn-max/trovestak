"use client";

import Link from 'next/link';
import { SafeImage } from './SafeImage'; // Assuming SafeImage is available or will be created

interface Category {
    slug: string;
    name: string;
    image: string;
    productCount: number;
}

interface CategoryNavProps {
    categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
    return (
        <nav className="bg-background py-8 overflow-x-auto scrollbar-hide">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-8 min-w-max pb-4">
                    {categories.map((category) => (
                        <Link
                            key={category.slug}
                            href={`/store?category=${category.slug}`}
                            className="flex flex-col items-center gap-3 group"
                        >
                            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary transition-all duration-300">
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                        {category.name}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
