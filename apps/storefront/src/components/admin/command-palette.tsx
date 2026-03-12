"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    ShoppingCart,
    Package,
    Users,
    FileText,
    ChevronRight,
    Command,
    Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{
        orders: any[];
        products: any[];
        customers: any[];
    }>({ orders: [], products: [], customers: [] });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleSearch = useCallback(async (val: string) => {
        if (!val || val.length < 2) {
            setResults({ orders: [], products: [], customers: [] });
            return;
        }

        setLoading(true);

        const [orders, products, customers] = await Promise.all([
            supabase.from("orders").select("id, status, total_amount").ilike("id", `%${val}%`).limit(3),
            supabase.from("products").select("id, name, slug").ilike("name", `%${val}%`).limit(3),
            supabase.from("profiles").select("id, full_name, email").or(`full_name.ilike.%${val}%,email.ilike.%${val}%`).limit(3)
        ]);

        setResults({
            orders: orders.data || [],
            products: products.data || [],
            customers: customers.data || []
        });
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    const navigateTo = (url: string) => {
        setOpen(false);
        setQuery("");
        router.push(url);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="p-4 border-b border-border flex items-center gap-3">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search orders, products, customers... (Cmd+K)"
                                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
                            />
                            {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                            <div className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold font-mono">
                                <Command className="w-2.5 h-2.5" /> K
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
                            {query.length < 2 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-muted-foreground">Type at least 2 characters to search...</p>
                                </div>
                            ) : results.orders.length === 0 && results.products.length === 0 && results.customers.length === 0 && !loading ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
                                </div>
                            ) : (
                                <div className="space-y-4 py-2">
                                    {results.orders.length > 0 && (
                                        <section>
                                            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Orders</h3>
                                            {results.orders.map((order) => (
                                                <button
                                                    key={order.id}
                                                    onClick={() => navigateTo(`/admin/orders/${order.id}`)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                                        <ShoppingCart className="w-4 h-4 text-orange-500" />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-bold truncate">#{order.id.slice(0, 8)}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">{order.status} • KES {order.total_amount.toLocaleString()}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </section>
                                    )}

                                    {results.products.length > 0 && (
                                        <section>
                                            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Products</h3>
                                            {results.products.map((product) => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => navigateTo(`/admin/products/${product.id}`)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-bold truncate">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">View product details</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </section>
                                    )}

                                    {results.customers.length > 0 && (
                                        <section>
                                            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Customers</h3>
                                            {results.customers.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    onClick={() => navigateTo(`/admin/customers/${customer.id}`)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-bold truncate">{customer.full_name || "Account User"}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </section>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><kbd className="bg-card px-1 rounded border shadow-sm">Enter</kbd> to select</span>
                                <span className="flex items-center gap-1"><kbd className="bg-card px-1 rounded border shadow-sm">Esc</kbd> to close</span>
                            </div>
                            <span>Admin Search v1.0</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
