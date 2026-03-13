import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import BrandClient from "./brand-client";
import { ErrorPage } from "@/components/error-page";

interface BrandInfo {
    name: string;
    description: string;
    logo_url: string | null;
    country: string;
    founded: string;
}

const brandConfigs: Record<string, BrandInfo> = {
    samsung: {
        name: "Samsung",
        description: "South Korean electronics giant known for innovation in smartphones, TVs, and home appliances. Leading the Android ecosystem with Galaxy devices.",
        logo_url: null,
        country: "South Korea",
        founded: "1938",
    },
    apple: {
        name: "Apple",
        description: "American technology company designing premium consumer electronics, software, and services. Known for iPhone, Mac, and seamless ecosystem integration.",
        logo_url: null,
        country: "United States",
        founded: "1976",
    },
    sony: {
        name: "Sony",
        description: "Japanese multinational producing premium electronics, gaming consoles (PlayStation), and entertainment content.",
        logo_url: null,
        country: "Japan",
        founded: "1946",
    },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const supabase = await createSupabaseServerClient();

        const { data: brand } = await supabase
            .from("brands")
            .select("name, description")
            .eq("slug", slug.toLowerCase())
            .single();

        const name = brand?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

        return {
            title: `${name} | Trovestak`,
            description: brand?.description || `Explore our collection of ${name} products at Trovestak.`,
        };
    } catch {
        return { title: "Brand | Trovestak" };
    }
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Fetch Brand Info
        const { data: bData } = await supabase
            .from("brands")
            .select("*")
            .eq("slug", slug.toLowerCase())
            .single();

        const brandInfo: BrandInfo = bData ? {
            name: bData.name,
            description: bData.description || "",
            logo_url: bData.logo_url,
            country: bData.country || "Global",
            founded: bData.founded || "—"
        } : (brandConfigs[slug.toLowerCase()] || {
            name: slug.charAt(0).toUpperCase() + slug.slice(1),
            description: `Explore our collection of ${slug} products.`,
            logo_url: null,
            country: "Global",
            founded: "—",
        });

        // 2. Fetch Brand Products
        const { data: products } = await supabase
            .from("products")
            .select(`
                id,
                name,
                slug,
                thumbnail_url,
                description,
                nav_category,
                product_variants(price_kes)
            `)
            .eq("is_active", true)
            .ilike("brand_type", slug)
            .order("created_at", { ascending: false })
            .limit(16);

        const safeProducts = (products || []).map((p: any) => ({
            ...p,
            product_variants: p.product_variants || []
        }));

        // Extract categories
        const categories = [...new Set(safeProducts.map((p) => p.nav_category).filter(Boolean))] as string[];

        return (
            <BrandClient
                slug={slug}
                brandInfo={brandInfo}
                products={safeProducts as any}
                categories={categories}
                totalProducts={safeProducts.length}
            />
        );
    } catch (err) {
        console.error("Brand Page Error:", err);
        return (
            <ErrorPage 
                title="Brand Unavailable"
                message={`We couldn't load the ${slug} brand page at this time.`}
            />
        );
    }
}
