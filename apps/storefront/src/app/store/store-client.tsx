"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardMinimal } from "@/components/ProductCardMinimal";

interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
}

interface StoreClientProps {
    categories: Category[];
    products: any[];
    brands: string[];
    category?: string;
    subcategory?: string;
    brand?: string;
    sort?: string;
}

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
];

export function StoreClient({
    categories,
    products,
    brands,
    category,
    subcategory,
    brand,
    sort,
}: StoreClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const setFilter = (key: string, value: string | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Clear subcategory when category changes
        if (key === 'category') params.delete('subcategory');
        router.push(`/store?${params.toString()}`);
    };

    const clearFilter = (key: string) => setFilter(key, undefined);

    const topCategories = categories.filter((c) => !c.parent_id);
    const subCategories = category
        ? categories.filter((c) => c.parent_id && categories.find((p) => p.slug === category && p.id === c.parent_id))
        : [];

    const activeFilters: { key: string; label: string }[] = [];
    if (category) activeFilters.push({ key: 'category', label: category });
    if (subcategory) activeFilters.push({ key: 'subcategory', label: subcategory });
    if (brand) activeFilters.push({ key: 'brand', label: brand });
    if (sort && sort !== 'newest') activeFilters.push({ key: 'sort', label: SORT_OPTIONS.find(s => s.value === sort)?.label || sort });

    return (
        <div className="min-h-screen bg-[#f5f5f7] pt-[44px]">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Page title */}
                <h1 className="text-[32px] font-semibold text-[#1d1d1f] mb-8">
                    {category ? topCategories.find(c => c.slug === category)?.name || category : 'Store'}
                </h1>

                {/* Top filter bar */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {/* Category pills */}
                    <button
                        onClick={() => router.push('/store')}
                        className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                            !category ? 'bg-black text-white' : 'bg-white text-[#1d1d1f] hover:bg-gray-100'
                        )}
                    >
                        All
                    </button>

                    {topCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter('category', cat.slug)}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                                category === cat.slug ? 'bg-black text-white' : 'bg-white text-[#1d1d1f] hover:bg-gray-100'
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}

                    {/* Divider */}
                    {brands.length > 0 && <div className="w-px h-8 bg-gray-200 mx-1 self-center" />}

                    {/* Brand select */}
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

                {/* Subcategory pills */}
                {subCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {subCategories.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setFilter('subcategory', sub.slug)}
                                className={cn(
                                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                                    subcategory === sub.slug ? 'bg-black text-white' : 'bg-white text-[#1d1d1f] hover:bg-gray-100'
                                )}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

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
