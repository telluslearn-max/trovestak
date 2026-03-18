import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getActiveTheme } from "@/lib/homepage-theme";
import { HeroSection } from "@/components/HeroSection";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { FeatureTile } from "@/components/FeatureTile";
import { FeaturedPair } from "@/components/FeaturedPair";
import { ExploreCarousel } from "@/components/ExploreCarousel";
import { PromoPair } from "@/components/PromoPair";
import { ComingToTrovestak } from "@/components/ComingToTrovestak";

export const dynamic = "force-dynamic";

type ProductRow = {
    name: string;
    slug: string;
    thumbnail_url: string | null;
    short_desc: string | null;
    created_at: string | null;
    nav_category: string | null;
    product_variants: { price_kes: number }[];
};

function toProduct(p: ProductRow) {
    const prices = (p.product_variants || []).map((v) => v.price_kes).filter((x) => x > 0);
    return { ...p, min_price: prices.length > 0 ? Math.min(...prices) : 0 };
}

async function getFeaturedProducts(limit: number) {
    try {
        const supabase = await createSupabaseServerClient();

        // Try featured first
        const { data: featured } = await supabase
            .from("products")
            .select("name, slug, thumbnail_url, short_desc, created_at, nav_category, product_variants(price_kes)")
            .eq("status", "published")
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(limit);

        const results = (featured || []).map((p) => toProduct(p as ProductRow));

        // Backfill from most-recent published if not enough
        if (results.length < limit) {
            const needed = limit - results.length;
            const existingSlugs = results.map((p) => p.slug);

            const { data: recent } = await supabase
                .from("products")
                .select("name, slug, thumbnail_url, short_desc, created_at, nav_category, product_variants(price_kes)")
                .eq("status", "published")
                .not("slug", "in", `(${existingSlugs.map((s) => `"${s}"`).join(",")})`)
                .order("created_at", { ascending: false })
                .limit(needed);

            results.push(...(recent || []).map((p) => toProduct(p as ProductRow)));
        }

        return results.slice(0, limit);
    } catch {
        return [];
    }
}

async function getComingProducts() {
    try {
        const supabase = await createSupabaseServerClient();

        const { data } = await supabase
            .from("products")
            .select("id, name, slug, thumbnail_url, created_at, metadata, product_variants(price_kes)")
            .eq("status", "published")
            .not("metadata->is_coming_soon", "is", null)
            .order("created_at", { ascending: false })
            .limit(6);

        return data || [];
    } catch {
        return [];
    }
}

async function getNewArrivals() {
    try {
        const supabase = await createSupabaseServerClient();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data } = await supabase
            .from("products")
            .select("id, name, slug, thumbnail_url, created_at, metadata, product_variants(price_kes)")
            .eq("status", "published")
            .gt("created_at", sevenDaysAgo)
            .order("created_at", { ascending: false })
            .limit(6);

        return data || [];
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const [products, comingProducts, newArrivals] = await Promise.all([
        getFeaturedProducts(7),
        getComingProducts(),
        getNewArrivals(),
    ]);

    const theme = getActiveTheme();

    const [p0, p1, p2, p3, p4, p5, p6] = products;

    return (
        <div className="min-h-screen">
            {/* Announcement banner — seasonal campaigns only */}
            {theme.banner && <AnnouncementBanner theme={theme} />}

            {/* 1. Hero tile — flagship, white */}
            <HeroSection product={p0 ?? null} theme={theme} />

            {/* 2. Second product tile — gray */}
            {p1 && <FeatureTile product={p1} background="gray" />}

            {/* 3. Third product tile — cream */}
            {p2 && <FeatureTile product={p2} background="cream" />}

            {/* 4. Side-by-side 2-up product tiles — dark left, light-blue right */}
            {p3 && p4 && <FeaturedPair left={p3} right={p4} />}

            {/* 5. Fourth product tile — black */}
            {p5 && <FeatureTile product={p5} background="black" />}

            {/* 6. Fifth product tile — dark */}
            {p6 && <FeatureTile product={p6} background="dark" />}

            {/* 7. 2-up promo — Trade-In + TroveXP */}
            <PromoPair />

            {/* 8. Coming to Trovestak — upcoming + new arrivals */}
            <ComingToTrovestak upcomingProducts={comingProducts} newArrivals={newArrivals} isProMember={false} />

            {/* 9. Horizontal-scroll explore carousel — black bg */}
            <ExploreCarousel />
        </div>
    );
}
