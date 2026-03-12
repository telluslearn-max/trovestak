"use client";

import { motion } from "framer-motion";
import { TrendingDown, Package, Sparkles, Clock } from "lucide-react";
import { DealCard } from "@/components/deals/DealCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    brand_type: string | null;
    product_variants: { price_kes: number }[];
    metadata: Record<string, any>;
}

interface DealsClientProps {
    dealOfDay: Product | null;
    topDeals: Product[];
    clearance: Product[];
}

export function DealsClient({ dealOfDay, topDeals, clearance }: DealsClientProps) {
    return (
        <div className="min-h-screen bg-background pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider mb-6"
                    >
                        <TrendingDown className="w-4 h-4" />
                        Limited Time Offers
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-4"
                    >
                        Deals<span className="text-red-500">.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        Unbeatable prices on premium tech. Deals expire daily — grab them before they&apos;re gone.
                    </motion.p>
                </div>

                {/* Deal of the Day */}
                {dealOfDay && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-red-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Deal of the Day
                            </h2>
                        </div>
                        <DealCard product={dealOfDay as any} variant="hero" />
                    </motion.div>
                )}

                {/* Tabs for different deal categories */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-8 bg-muted/20 p-1 rounded-2xl">
                        <TabsTrigger
                            value="all"
                            className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                            All Deals ({topDeals.length + clearance.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="top"
                            className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                            Top Deals ({topDeals.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="clearance"
                            className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                            Clearance ({clearance.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...topDeals, ...clearance].map((product) => (
                                <DealCard key={product.id} product={product as any} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="top">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {topDeals.map((product) => (
                                <DealCard key={product.id} product={product as any} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="clearance">
                        {clearance.length === 0 ? (
                            <div className="text-center py-20">
                                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">No clearance items available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {clearance.map((product) => (
                                    <DealCard key={product.id} product={product as any} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Promo Banner */}
                <div className="mt-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-[2.5rem] p-10 text-center border border-primary/20">
                    <Clock className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-foreground mb-2">
                        New Deals Daily
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        Subscribe to get notified when new deals drop
                    </p>
                    <div className="flex gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 h-12 px-6 bg-background/50 border border-border/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button className="h-12 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                            Notify Me
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
