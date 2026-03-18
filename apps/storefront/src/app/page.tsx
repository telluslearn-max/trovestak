import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getActiveTheme } from "@/lib/homepage-theme";
import { HeroSection } from "@/components/HeroSection";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { FeatureTile } from "@/components/FeatureTile";
import { FeaturedPair } from "@/components/FeaturedPair";
import { EndlessEntertainment } from "@/components/EndlessEntertainment";
import { PromoPair } from "@/components/PromoPair";
import { ComingToTrovestak } from "@/components/ComingToTrovestak";
import { ThreeColHero } from "@/components/ThreeColHero";

const Gap = () => <div className="h-[10px]" style={{ background: '#f5f5f7' }} />;

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
        <div className="min-h-screen bg-[#f5f5f7]">
            {/* Announcement banner — seasonal campaigns only */}
            {theme.banner && <AnnouncementBanner theme={theme} />}

            {/* 1. Hero tile — flagship */}
            <HeroSection product={p0 ?? null} theme={theme} />
            <Gap />

            {/* 2. Second product tile — gray radial gradient */}
            <FeatureTile product={p1 ?? null} background="gray" />
            <Gap />

            {/* 3. Third product tile — 3-column wings hero */}
            <ThreeColHero product={p2 ?? null} />
            <Gap />

            {/* 4–6. Bento grid — 3 rows of 2 cards (6 total) */}
            <FeaturedPair left={p3 ?? null} right={p4 ?? null} />
            <FeaturedPair left={p5 ?? null} right={p6 ?? null} leftBg="#000000" rightBg="#f5f5f7" />
            <PromoPair />

            {/* 7. Endless entertainment */}
            <EndlessEntertainment />
            <Gap />

            {/* 8. Coming to Trovestak — upcoming + new arrivals */}
            <ComingToTrovestak upcomingProducts={comingProducts} newArrivals={newArrivals} isProMember={false} />
        </div>
    );
}
