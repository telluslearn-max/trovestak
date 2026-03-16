import { createSupabaseServerClient } from "@/lib/supabase-server";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeatureSections } from "@/components/FeatureSections";

export const dynamic = "force-dynamic";

async function getHeroProduct() {
    try {
        const supabase = await createSupabaseServerClient();

        // Try is_featured first, fall back to most recent published product
        const { data } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, product_variants(price_kes)")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!data) return null;

        const prices = (data.product_variants || [])
            .map((v: any) => v.price_kes)
            .filter((p: number) => p > 0);
        const min_price = prices.length > 0 ? Math.min(...prices) : 0;

        return { ...data, min_price };
    } catch {
        return null;
    }
}

async function getFeaturedProducts() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, product_variants(price_kes)")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(4);

        return (data || []).map((p: any) => {
            const prices = (p.product_variants || [])
                .map((v: any) => v.price_kes)
                .filter((x: number) => x > 0);
            return { ...p, min_price: prices.length > 0 ? Math.min(...prices) : 0 };
        });
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const [heroProduct, featuredProducts] = await Promise.all([
        getHeroProduct(),
        getFeaturedProducts(),
    ]);

    // The hero is always the first product; feature sections skip the hero
    const featureProducts = featuredProducts.slice(1, 3);

    return (
        <div className="min-h-screen">
            {heroProduct ? (
                <HeroSection product={heroProduct} />
            ) : (
                <div className="min-h-screen bg-[#1d1d1f] flex items-center justify-center">
                    <p className="text-[rgba(245,245,247,0.5)]">No products yet.</p>
                </div>
            )}

            <CategoryGrid />

            {featureProducts.length > 0 && (
                <FeatureSections products={featureProducts} />
            )}
        </div>
    );
}
