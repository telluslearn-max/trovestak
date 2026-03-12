"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { searchProductsAction } from "./actions";
import { formatKES } from "@/lib/formatters";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    brand_type: string | null;
    nav_category: string | null;
    product_variants?: { price_kes: number }[];
}

export default function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const [inputValue, setInputValue] = useState(query);
    const [results, setResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("trovestak-recent-searches");
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved).slice(0, 5));
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        setInputValue(query);
        if (query.length >= 2) {
            performSearch(query);
        } else {
            setResults([]);
        }
    }, [query]);

    const performSearch = async (searchTerm: string) => {
        if (searchTerm.length < 2) return;

        setIsSearching(true);

        const result = await searchProductsAction(searchTerm);

        if (!result.error && result.products) {
            setResults(result.products as Product[]);
        }
        setIsSearching(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            saveRecentSearch(inputValue.trim());
            router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
        }
    };

    const saveRecentSearch = (term: string) => {
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("trovestak-recent-searches", JSON.stringify(updated));
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem("trovestak-recent-searches");
    };

    const trendingSearches = ["iPhone 16 Pro", "Galaxy S25 Ultra", "AirPods Pro", "MacBook Pro", "iPad Air"];

    const getMinPrice = (product: Product): number => {
        if (!product.product_variants || product.product_variants.length === 0) return 0;
        const prices = product.product_variants.map(v => v.price_kes).filter(Boolean);
        return prices.length > 0 ? Math.min(...prices) / 100 : 0;
    };

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Store
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">
                        Search<span className="text-muted-foreground/30">.</span>
                    </h1>
                </div>

                {/* Search Input */}
                <form onSubmit={handleSubmit} className="relative mb-12">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/40" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Search products, brands, categories..."
                        autoFocus
                        className="w-full pl-16 pr-6 py-5 text-xl bg-muted/30 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium placeholder:text-muted-foreground/40"
                    />
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => setInputValue("")}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </form>

                {/* Results */}
                {query.length >= 2 && (
                    <div className="mb-8">
                        <p className="text-sm text-muted-foreground font-medium mb-4">
                            {isSearching ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
                        </p>

                        <AnimatePresence mode="popLayout">
                            {results.length > 0 ? (
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {results.map((product, i) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link
                                                href={`/products/${product.slug}`}
                                                className="group flex gap-5 p-5 bg-muted/20 rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                                            >
                                                <div className="w-20 h-20 bg-muted/30 rounded-xl flex-shrink-0 overflow-hidden relative">
                                                    {product.thumbnail_url ? (
                                                        <Image
                                                            src={product.thumbnail_url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Search className="w-8 h-8 text-muted-foreground/30" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
                                                        {product.brand_type}
                                                    </p>
                                                    <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                        {product.description}
                                                    </p>
                                                    <p className="text-lg font-black text-foreground mt-2">
                                                        {formatKES(getMinPrice(product))}
                                                    </p>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : !isSearching && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20"
                                >
                                    <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">No results found</h3>
                                    <p className="text-muted-foreground">Try a different search term</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Initial State - Trending & Recent */}
                {query.length < 2 && (
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Trending */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Trending</h2>
                            </div>
                            <div className="space-y-3">
                                {trendingSearches.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/search?q=${encodeURIComponent(term)}`}
                                        className="block p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors font-medium text-foreground"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Recent */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Searches</h2>
                                {recentSearches.length > 0 && (
                                    <button
                                        onClick={clearRecentSearches}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {recentSearches.length > 0 ? (
                                <div className="space-y-3">
                                    {recentSearches.map((term) => (
                                        <Link
                                            key={term}
                                            href={`/search?q=${encodeURIComponent(term)}`}
                                            className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors"
                                        >
                                            <span className="font-medium text-foreground">{term}</span>
                                            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground/60 text-sm">No recent searches</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
