"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardMinimal } from "@/components/ProductCardMinimal";

interface CategoryClientProps {
    title: string;
    products: any[];
    brands: string[];
    brand?: string;
    sort?: string;
    slug: string;
}

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
];

export function CategoryClient({ title, products, brands, brand, sort, slug }: CategoryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const setFilter = (key: string, value: string | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/category/${slug}?${params.toString()}`);
    };

    const clearFilter = (key: string) => setFilter(key, undefined);

    const activeFilters: { key: string; label: string }[] = [];
    if (brand) activeFilters.push({ key: 'brand', label: brand });
    if (sort && sort !== 'newest') activeFilters.push({ key: 'sort', label: SORT_OPTIONS.find(s => s.value === sort)?.label || sort });

    return (
        <div className="min-h-screen bg-[#f5f5f7] pt-[44px]">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Page title */}
                <h1 className="text-[32px] font-semibold text-[#1d1d1f] mb-8">{title}</h1>

                {/* Top filter bar */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {brands.length > 0 && (
                        <>
                            <select
                                value={brand || ''}
                                onChange={(e) => setFilter('brand', e.target.value || undefined)}
                                className="px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1d1d1f] border-none outline-none cursor-pointer hover:bg-gray-100 transition-colors appearance-none"
                            >
                                <option value="">Brand</option>
                                {brands.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            <div className="w-px h-8 bg-gray-200 mx-1 self-center" />
                        </>
                    )}

                    {/* Sort select */}
                    <select
                        value={sort || 'newest'}
                        onChange={(e) => setFilter('sort', e.target.value)}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1d1d1f] border-none outline-none cursor-pointer hover:bg-gray-100 transition-colors appearance-none"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Active filter × pills */}
                    {activeFilters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => clearFilter(f.key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-black text-white"
                        >
                            {f.label}
                            <X className="w-3 h-3" />
                        </button>
                    ))}
                </div>

                {/* Product count */}
                <p className="text-sm text-[#6e6e73] mb-6">{products.length} products</p>

                {/* Product grid */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <ProductCardMinimal key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <Package className="w-12 h-12 text-[#6e6e73] mx-auto mb-4" />
                        <p className="text-lg font-medium text-[#1d1d1f]">No products found</p>
                        <p className="text-[#6e6e73] text-sm mt-1">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
