import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DealsClient } from "./deals-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Deals | Trovestak",
    description: "Today's deals. Tomorrow's are different.",
};

interface Product {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    brand: string | null;
    product_variants: { price_kes: number }[];
    metadata: Record<string, any>;
}

export const dynamic = 'force-dynamic';

export default async function DealsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch products with compare_price (discounted items)
    const { data: allProducts, error } = await supabase
        .from("products")
        .select(`
            id,
            name,
            slug,
            thumbnail_url,
            brand,
            product_variants(price_kes),
            metadata
        `)
        .eq("status", "published")
        .not("metadata->compare_price", "is", null);

    if (error) {
        console.error("Error fetching deals:", error);
        return (
            <div className="min-h-screen pt-32 text-center text-muted-foreground">
                Unable to load deals. Please try again later.
            </div>
        );
    }

    // Categorize products
    const deals: Product[] = [];
    const clearanceItems: Product[] = [];
    let dealOfDayItem: Product | null = null;

    allProducts?.forEach((product: any) => {
        const meta = product.metadata || {};
        const dealType = meta.deal_type;
        const comparePrice = meta.compare_price || 0;
        const currentPrice = product.product_variants[0]?.price_kes
            ? Math.round(product.product_variants[0].price_kes / 100)
            : 0;

        // Only include if there's actually a discount
        if (comparePrice > currentPrice) {
            if (dealType === "deal_of_day") {
                if (!dealOfDayItem) dealOfDayItem = product;
            } else if (dealType === "clearance" || dealType === "open_box") {
                clearanceItems.push(product);
            } else {
                deals.push(product);
            }
        }
    });

    // If no deal of day, use the highest discount
    if (!dealOfDayItem && deals.length > 0) {
        dealOfDayItem = deals.reduce((max, p) => {
            const maxDiscount = (max.metadata?.compare_price || 0) -
                (max.product_variants[0]?.price_kes ? Math.round(max.product_variants[0].price_kes / 100) : 0);
            const pDiscount = (p.metadata?.compare_price || 0) -
                (p.product_variants[0]?.price_kes ? Math.round(p.product_variants[0].price_kes / 100) : 0);
            return pDiscount > maxDiscount ? p : max;
        });
    }

    return (
        <DealsClient
            dealOfDay={dealOfDayItem}
            topDeals={deals.slice(0, 12)}
            clearance={clearanceItems}
        />
    );
}
