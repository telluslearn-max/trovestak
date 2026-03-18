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
        console.error("[ Server ] Error fetching categories:", { message: error.message, code: error.code, details: error.details });
        return [];
    }
    return data || [];
}

async function getProducts(categorySlug?: string, subcategorySlug?: string, brand?: string, sort?: string) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("status", "published");

    if (brand) {
        query = query.eq('brand', brand);
    }

    if (subcategorySlug) {
        query = query.ilike("nav_subcategory", subcategorySlug);
    } else if (categorySlug) {
        query = query.ilike("nav_category", categorySlug);
    }

    // Apply sorting logic
    if (sort === "price_asc") {
        query = query.order("sell_price", { ascending: true });
    } else if (sort === "price_desc") {
        query = query.order("sell_price", { ascending: false });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error("[ Server ] Error fetching products:", { message: error.message, code: error.code, details: error.details });
        return [];
    }

    return (data || []).map((p: any) => ({
        ...p,
        category: p.categories?.[0] || null,
        variants: p.product_variants || [],
    }));
}

async function getBrands() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("products")
        .select("brand")
        .eq("status", "published")
        .not("brand", "is", null);

    if (error) return [];

    // Get unique non-empty brands
    const brands = Array.from(new Set((data || []).map((d: { brand: string }) => d.brand).filter(Boolean)));
    return brands.sort() as string[];
}

export const dynamic = 'force-dynamic';

export default async function StorePage({ searchParams }: StorePageProps) {
    try {
        const sp = await searchParams;
        const category = sp.category;
        const subcategory = sp.subcategory;
        const brand = sp.brand;
        const sort = sp.sort;

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
    } catch (error: any) {
        console.error("StorePage Error:", error);
        return (
            <ErrorPage 
                title="Store Unavailable"
                message="We encountered an issue loading the storefront. Our team has been notified and is investigating."
            />
        );
    }
}

import { ErrorPage } from "@/components/error-page";
import Link from "next/link";
