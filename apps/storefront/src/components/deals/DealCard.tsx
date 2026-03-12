"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, TrendingDown, Package, Percent, ShoppingBag } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { formatKES } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface DealProduct {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    brand_type: string | null;
    product_variants: { price_kes: number }[];
    metadata: {
        compare_price?: number;
        deal_expires?: string;
        deal_type?: "deal_of_day" | "clearance" | "open_box";
    };
}

interface DealCardProps {
    product: DealProduct;
    variant?: "default" | "hero" | "compact";
}

export function DealCard({ product, variant = "default" }: DealCardProps) {
    const currentPrice = product.product_variants[0]?.price_kes
        ? Math.round(product.product_variants[0].price_kes / 100)
        : 0;
    const originalPrice = product.metadata?.compare_price || 0;
    const discountPercent = originalPrice > 0
        ? Math.round((1 - currentPrice / originalPrice) * 100)
        : 0;
    const dealType = product.metadata?.deal_type || "deal_of_day";
    const expiresAt = product.metadata?.deal_expires;

    const dealTypeConfig = {
        deal_of_day: {
            icon: TrendingDown,
            label: "Deal of the Day",
            color: "bg-red-500",
            textColor: "text-red-400"
        },
        clearance: {
            icon: Package,
            label: "Clearance",
            color: "bg-purple-500",
            textColor: "text-purple-400"
        },
        open_box: {
            icon: Package,
            label: "Open Box",
            color: "bg-amber-500",
            textColor: "text-amber-400"
        },
    };

    const config = dealTypeConfig[dealType as keyof typeof dealTypeConfig] || dealTypeConfig.deal_of_day;
    const Icon = config.icon;

    if (variant === "hero") {
        return (
            <Link
                href={`/products/${product.slug}`}
                className="group relative block bg-gradient-to-br from-primary/10 via-background to-background rounded-[2.5rem] overflow-hidden border border-border/30 hover:border-primary/30 transition-all duration-500 cursor-pointer"
            >
                <div className="absolute top-6 left-6 z-10">
                    <span className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white",
                        config.color
                    )}>
                        <Icon className="w-4 h-4" />
                        {config.label}
                    </span>
                </div>

                {expiresAt && (
                    <div className="absolute top-6 right-6 z-10 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1">
                            <Clock className="w-3 h-3" />
                            Ends in
                        </div>
                        <CountdownTimer endTime={expiresAt} />
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8 p-10 items-center">
                    <div className="relative aspect-square bg-muted/20 rounded-2xl overflow-hidden">
                        {product.thumbnail_url ? (
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            {product.brand_type}
                        </p>
                        <h3 className="text-3xl font-black tracking-tight text-foreground mb-4 group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>

                        <div className="flex items-baseline gap-4 mb-6">
                            <span className="text-4xl font-black text-foreground">
                                {formatKES(currentPrice)}
                            </span>
                            {originalPrice > currentPrice && (
                                <span className="text-xl font-bold text-muted-foreground line-through">
                                    {formatKES(originalPrice)}
                                </span>
                            )}
                        </div>

                        {discountPercent > 0 && (
                            <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                                "bg-emerald-500/10 border border-emerald-500/20"
                            )}>
                                <Percent className="w-4 h-4 text-emerald-500" />
                                <span className="text-lg font-black text-emerald-500">
                                    Save {discountPercent}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/products/${product.slug}`}
            className="group relative bg-muted/20 rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all duration-300 cursor-pointer"
        >
            {/* Deal Badge */}
            <div className="absolute top-3 left-3 z-10">
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white",
                    config.color
                )}>
                    <Icon className="w-3 h-3" />
                    {discountPercent > 0 && `${discountPercent}% Off`}
                </span>
            </div>

            {/* Image */}
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
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {product.brand_type}
                </p>
                <h4 className="font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                    {product.name}
                </h4>

                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-foreground">
                        {formatKES(currentPrice)}
                    </span>
                    {originalPrice > currentPrice && (
                        <span className="text-sm font-bold text-muted-foreground/50 line-through">
                            {formatKES(originalPrice)}
                        </span>
                    )}
                </div>

                {/* Countdown for compact */}
                {variant === "compact" && expiresAt && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                        <CountdownTimer endTime={expiresAt} className="text-sm" />
                    </div>
                )}
            </div>
        </Link>
    );
}
