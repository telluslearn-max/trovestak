import { createSupabaseServerClient } from "@/lib/supabase-server";
import { StoreClient } from "./store-client";

interface StorePageProps {
    searchParams: Promise<{
        category?: string;
        subcategory?: string;
        brand?: string;
        sort?: string;
    }>;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
}

async function getCategories(): Promise<Category[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
    return data || [];
}

async function getProducts(categorySlug?: string, subcategorySlug?: string, brand?: string, sort?: string) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_active", true);

    if (brand) {
        query = query.eq('brand_type', brand);
    }

    if (subcategorySlug) {
        query = query.ilike("nav_subcategory", subcategorySlug);
    } else if (categorySlug) {
        query = query.ilike("nav_category", categorySlug);
    }

    // Apply sorting logic
    if (sort === "price_asc") {
        query = query.order("base_price", { ascending: true });
    } else if (sort === "price_desc") {
        query = query.order("base_price", { ascending: false });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }

    return (data || []).map((p: any) => ({
        ...p,
        variants: p.product_variants || [],
    }));
}

async function getBrands() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("products")
        .select("brand_type")
        .eq("is_active", true)
        .not("brand_type", "is", null);

    if (error) return [];

    // Get unique non-empty brands
    const brands = Array.from(new Set(data?.map((d: { brand_type: string }) => d.brand_type).filter(Boolean)));
    return brands.sort() as string[];
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function StorePage({ searchParams }: StorePageProps) {
    const { category, subcategory, brand, sort } = await searchParams;

    // Fetch categories, products, and brands in parallel
    const [categories, products, brands] = await Promise.all([
        getCategories(),
        getProducts(category, subcategory, brand, sort),
        getBrands()
    ]);

    return (
        <StoreClient
            categories={categories}
            products={products}
            brands={brands}
            category={category}
            subcategory={subcategory}
            brand={brand}
            sort={sort}
        />
    );
}
