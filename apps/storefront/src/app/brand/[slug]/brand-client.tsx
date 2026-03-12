"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Package, Award, Shield } from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { Breadcrumb } from "@/components/Breadcrumb";

interface Product {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    description: string | null;
    nav_category?: string;
    product_variants: { price_kes: number }[];
}

interface BrandInfo {
    name: string;
    description: string;
    logo_url: string | null;
    country: string;
    founded: string;
}

interface BrandClientProps {
    slug: string;
    brandInfo: BrandInfo;
    products: Product[];
    categories: string[];
    totalProducts: number;
}

export default function BrandClient({ slug, brandInfo, products, categories, totalProducts }: BrandClientProps) {
    return (
        <div className="min-h-screen bg-background pt-20">
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary/10 via-background to-background py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <Breadcrumb
                        items={[
                            { label: "Store", href: "/store" },
                            { label: "Brands", href: "/store" },
                            { label: brandInfo.name },
                        ]}
                        className="mb-6"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-8"
                    >
                        {/* Brand Logo Placeholder */}
                        <div className="w-24 h-24 bg-muted/30 rounded-2xl flex items-center justify-center text-4xl border border-border/30 overflow-hidden relative">
                            {brandInfo.logo_url ? (
                                <Image src={brandInfo.logo_url} alt={brandInfo.name} fill className="object-contain p-4" />
                            ) : (
                                brandInfo.name.charAt(0)
                            )}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-4">
                                {brandInfo.name}
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
                                {brandInfo.description}
                            </p>

                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Award className="w-4 h-4" />
                                    Founded {brandInfo.founded}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Package className="w-4 h-4" />
                                    {totalProducts} products
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="w-4 h-4" />
                                    Official EA Warranty
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Category Pills */}
                {brandInfo && categories.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                            Categories
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/store?brand=${slug}`}
                                className="px-5 py-2.5 bg-foreground text-background rounded-full text-sm font-bold"
                            >
                                All {brandInfo.name}
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/store?brand=${slug}&category=${cat}`}
                                    className="px-5 py-2.5 bg-muted/30 rounded-full text-sm font-bold hover:bg-muted/50 transition-colors"
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                            All Products
                        </h2>
                        <Link
                            href={`/store?brand=${slug}`}
                            className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-[2.5rem]">
                            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                No products found for this brand
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {products.map((product, i) => {
                                const price = product.product_variants[0]?.price_kes
                                    ? Math.round(product.product_variants[0].price_kes / 100)
                                    : 0;

                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Link
                                            href={`/products/${product.slug}`}
                                            className="group block bg-muted/20 rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                                        >
                                            <div className="relative aspect-square bg-muted/10">
                                                {product.thumbnail_url ? (
                                                    <Image
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-10 h-10 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </h3>
                                                <p className="text-lg font-black text-foreground">
                                                    {formatKES(price * 100)}
                                                </p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CTA */}
                {brandInfo && (
                    <div className="text-center">
                        <Link
                            href={`/store?brand=${slug}`}
                            className="inline-flex items-center gap-2 px-10 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                            Shop All {brandInfo.name} Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
