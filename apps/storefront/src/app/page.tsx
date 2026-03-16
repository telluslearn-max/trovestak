import { createSupabaseServerClient } from "@/lib/supabase-server";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { MpesaStrip } from "@/components/MpesaStrip";
import { ProductShelf } from "@/components/ProductShelf";
import { TroveVoiceStrip } from "@/components/TroveVoiceStrip";
import { FeatureSections } from "@/components/FeatureSections";

export const dynamic = "force-dynamic";

async function getHeroProduct() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, product_variants(price_kes)")
            .eq("status", "published")
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!data) return null;

        const prices = (data.product_variants || [])
            .map((v: { price_kes: number }) => v.price_kes)
            .filter((p: number) => p > 0);
        return { ...data, min_price: prices.length > 0 ? Math.min(...prices) : 0 };
    } catch {
        return null;
    }
}

async function getJustInProducts() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, created_at, product_variants(price_kes)")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(8);

        return (data || []).map((p: {
            name: string;
            slug: string;
            thumbnail_url: string | null;
            short_desc: string | null;
            created_at: string | null;
            product_variants: { price_kes: number }[];
        }) => {
            const prices = (p.product_variants || [])
                .map((v) => v.price_kes)
                .filter((x) => x > 0);
            return { ...p, min_price: prices.length > 0 ? Math.min(...prices) : 0 };
        });
    } catch {
        return [];
    }
}

async function getFeaturedProducts() {
    try {
        const supabase = await createSupabaseServerClient();

        // Try is_featured first
        const { data: featured } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, created_at, product_variants(price_kes)")
            .eq("status", "published")
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(2);

        const toMap = (p: {
            name: string;
            slug: string;
            thumbnail_url: string | null;
            short_desc: string | null;
            created_at: string | null;
            product_variants: { price_kes: number }[];
        }) => {
            const prices = (p.product_variants || []).map((v) => v.price_kes).filter((x) => x > 0);
            return { ...p, min_price: prices.length > 0 ? Math.min(...prices) : 0 };
        };

        if (featured && featured.length >= 2) return featured.map(toMap);

        // Fallback: 3rd and 4th most recent
        const { data: recent } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, created_at, product_variants(price_kes)")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .range(2, 3);

        return (recent || []).map(toMap);
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const [heroProduct, justInProducts, featuredProducts] = await Promise.all([
        getHeroProduct(),
        getJustInProducts(),
        getFeaturedProducts(),
    ]);

    return (
        <div className="min-h-screen">
            {/* 1. Store hero — light, Apple-style */}
            <HeroSection product={heroProduct} />

            {/* 2. Category shelf — horizontal scroll */}
            <CategoryGrid />

            {/* 3. M-Pesa financing band */}
            <MpesaStrip />

            {/* 4. "Just In" — 8-product discovery grid */}
            <ProductShelf products={justInProducts} />

            {/* 5. TroveVoice — voice concierge promo */}
            <TroveVoiceStrip />

            {/* 6. Editorial feature sections — 2 hero products */}
            <FeatureSections products={featuredProducts} />
        </div>
    );
}
