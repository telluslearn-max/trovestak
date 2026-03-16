"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { useSearchStore } from "@/stores/search";
import { searchProductsAction } from "@/app/search/actions";
import { formatKES } from "@/lib/formatters";

const TRENDING = ["iPhone 16 Pro", "Galaxy S25 Ultra", "AirPods Pro", "MacBook Pro M4", "Starlink"];

const RECENT_KEY = "trovestak_recent_searches";

function getRecentSearches(): string[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch {
        return [];
    }
}

function addRecentSearch(term: string) {
    const recents = getRecentSearches();
    const updated = [term, ...recents.filter(r => r !== term)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export function SearchOverlay() {
    const { isOpen, setIsOpen } = useSearchStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setRecentSearches(getRecentSearches());
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    // ESC to close
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [setIsOpen]);

    const doSearch = useCallback(async (term: string) => {
        if (term.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        const { products } = await searchProductsAction(term);
        setResults(products || []);
        setIsLoading(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 300);
    };

    const handleSubmit = (term: string) => {
        if (!term.trim()) return;
        addRecentSearch(term.trim());
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(term.trim())}`);
    };

    const getMinPrice = (product: any): number => {
        const variants = product.product_variants || [];
        const prices = variants.map((v: any) => v.price_kes).filter(Boolean);
        return prices.length > 0 ? Math.min(...prices) : 0;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed inset-0 z-[10000] bg-[rgba(29,29,31,0.97)] backdrop-blur-xl overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="max-w-2xl mx-auto px-4 pt-20 pb-12">
                        {/* Input */}
                        <div className="relative flex items-center gap-3 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(245,245,247,0.4)]" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={handleChange}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
                                    placeholder="Search Trovestak"
                                    className="w-full h-14 pl-12 pr-4 bg-[rgba(245,245,247,0.1)] text-white text-lg rounded-2xl outline-none placeholder:text-[rgba(245,245,247,0.3)] focus:bg-[rgba(245,245,247,0.15)] transition-colors"
                                />
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-[rgba(245,245,247,0.7)] hover:text-white transition-colors whitespace-nowrap"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Results */}
                        {query.length >= 2 ? (
                            <div>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-3 animate-pulse">
                                                <div className="w-10 h-10 rounded-lg bg-[rgba(245,245,247,0.1)]" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-[rgba(245,245,247,0.1)] rounded w-3/4" />
                                                    <div className="h-3 bg-[rgba(245,245,247,0.1)] rounded w-1/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="space-y-1">
                                        {results.slice(0, 6).map(product => {
                                            const price = getMinPrice(product);
                                            return (
                                                <button
                                                    key={product.id}
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        router.push(`/products/${product.slug}`);
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(245,245,247,0.08)] transition-colors text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-[rgba(245,245,247,0.1)] flex-shrink-0 overflow-hidden">
                                                        {product.thumbnail_url ? (
                                                            <Image
                                                                src={product.thumbnail_url}
                                                                alt={product.name}
                                                                width={40}
                                                                height={40}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium line-clamp-1">{product.name}</p>
                                                        <p className="text-xs text-[rgba(245,245,247,0.5)]">
                                                            {product.nav_category} {price > 0 ? `· ${formatKES(price)}` : ''}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handleSubmit(query)}
                                            className="w-full flex items-center justify-center gap-2 p-3 mt-2 text-sm text-[rgba(245,245,247,0.7)] hover:text-white transition-colors"
                                        >
                                            See all results for &ldquo;{query}&rdquo;
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[rgba(245,245,247,0.5)] text-center py-6">
                                        No results for &ldquo;{query}&rdquo;
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Recent searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-[rgba(245,245,247,0.4)] uppercase tracking-wider mb-3">Recent</p>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map(term => (
                                                <button
                                                    key={term}
                                                    onClick={() => handleSubmit(term)}
                                                    className="px-3 py-1.5 rounded-full bg-[rgba(245,245,247,0.1)] text-sm text-[rgba(245,245,247,0.8)] hover:bg-[rgba(245,245,247,0.15)] hover:text-white transition-colors"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trending */}
                                <div>
                                    <p className="text-xs font-semibold text-[rgba(245,245,247,0.4)] uppercase tracking-wider mb-3">Trending</p>
                                    <div className="flex flex-wrap gap-2">
                                        {TRENDING.map(term => (
                                            <button
                                                key={term}
                                                onClick={() => handleSubmit(term)}
                                                className="px-3 py-1.5 rounded-full bg-[rgba(245,245,247,0.1)] text-sm text-[rgba(245,245,247,0.8)] hover:bg-[rgba(245,245,247,0.15)] hover:text-white transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
