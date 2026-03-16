import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CategoryTracker } from "@/components/concierge/CategoryTracker";
import { CategoryClient } from "./CategoryClient";
import { ErrorPage } from "@/components/error-page";

export const dynamic = 'force-dynamic';

const CATEGORY_TITLES: Record<string, string> = {
    mobile: "Mobile Phones",
    smartphones: "Mobile Phones",
    computing: "Computing",
    audio: "Audio",
    gaming: "Gaming",
    cameras: "Cameras",
    wearables: "Wearables",
    "smart-home": "Smart Home",
};

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ brand?: string; sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
    let slug = "";
    let brand: string | undefined;
    let sort: string | undefined;

    try {
        const resolvedParams = await params;
        slug = resolvedParams.slug;
        const resolvedSearchParams = await searchParams;
        brand = resolvedSearchParams.brand;
        sort = resolvedSearchParams.sort;
    } catch (e) {
        console.error("[CategoryPage] Params resolution error:", e);
        return <ErrorPage message="Invalid category parameters" />;
    }

    try {
        const supabase = await createSupabaseServerClient();

        // Get category by slug
        const { data: category } = await supabase
            .from("categories")
            .select("id, slug, parent_id")
            .eq("slug", slug)
            .maybeSingle();

        let products: any[] = [];

        if (category) {
            const { data: allCategories } = await supabase
                .from("categories")
                .select("id")
                .eq("parent_id", category.id);

            const categoryIds = [category.id, ...(allCategories?.map(c => c.id) || [])];

            const { data: productCategories } = await supabase
                .from("product_categories")
                .select("product_id")
                .in("category_id", categoryIds);

            const productIds = productCategories?.map(pc => pc.product_id) || [];

            if (productIds.length > 0) {
                let query = supabase
                    .from("products")
                    .select("id, name, slug, thumbnail_url, brand, product_variants(price_kes)")
                    .eq("status", "published")
                    .in("id", productIds)
                    .order("created_at", { ascending: false })
                    .limit(100);

                if (brand) query = query.eq("brand", brand);

                const { data } = await query;
                products = data || [];
            }
        } else {
            // Fallback: match by nav_category for legacy data
            let query = supabase
                .from("products")
                .select("id, name, slug, thumbnail_url, brand, product_variants(price_kes)")
                .eq("status", "published")
                .eq("nav_category", slug)
                .order("created_at", { ascending: false })
                .limit(100);

            if (brand) query = query.eq("brand", brand);

            const { data } = await query;
            products = data || [];
        }

        // Price sort (done in memory since price is in a related table)
        if (sort === 'price_asc' || sort === 'price_desc') {
            products = [...products].sort((a, b) => {
                const getMin = (p: any) => {
                    const prices = (p.product_variants || []).map((v: any) => v.price_kes).filter((x: number) => x > 0);
                    return prices.length > 0 ? Math.min(...prices) : Infinity;
                };
                return sort === 'price_asc' ? getMin(a) - getMin(b) : getMin(b) - getMin(a);
            });
        }

        // Extract unique brands from the full unfiltered set for filter pills
        // Re-fetch all brands for this category (ignore current brand filter)
        const allBrands: string[] = [...new Set(
            products.map((p: any) => p.brand).filter(Boolean) as string[]
        )].sort();

        const title = CATEGORY_TITLES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);

        return (
            <>
                <CategoryTracker categoryId={category?.id} />
                <CategoryClient
                    title={title}
                    products={products}
                    brands={allBrands}
                    brand={brand}
                    sort={sort}
                    slug={slug}
                />
            </>
        );
    } catch (error) {
        console.error("[CategoryPage] Error:", error);
        return <ErrorPage title="Category Error" message="We encountered an issue while loading this category." />;
    }
}
