import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatKES } from "@/lib/formatters";

import { Breadcrumb } from "@/components/Breadcrumb";
import Link from "next/link";
import Image from "next/image";
import { Package, Smartphone, Laptop, Headphones, Gamepad2, Camera, Watch, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string; subcategory: string; brand: string }>;
}

const categoryConfig: Record<string, { title: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
    "mobile": { title: "Mobile Phones", Icon: Smartphone, color: "from-blue-500/20 to-purple-500/20" },
    "computing": { title: "Computing", Icon: Laptop, color: "from-emerald-500/20 to-teal-500/20" },
    "audio": { title: "Audio", Icon: Headphones, color: "from-rose-500/20 to-orange-500/20" },
    "gaming": { title: "Gaming", Icon: Gamepad2, color: "from-violet-500/20 to-pink-500/20" },
    "cameras": { title: "Cameras", Icon: Camera, color: "from-amber-500/20 to-yellow-500/20" },
    "wearables": { title: "Wearables", Icon: Watch, color: "from-cyan-500/20 to-blue-500/20" },
    "smart-home": { title: "Smart Home", Icon: Home, color: "from-lime-500/20 to-green-500/20" },
};

const brandKeywords: Record<string, string[]> = {
    'apple': ['iPhone', 'iPad', 'Mac'],
    'samsung': ['Samsung', 'Galaxy'],
    'google': ['Pixel'],
    'xiaomi': ['Xiaomi', 'Redmi', 'POCO'],
    'oppo': ['OPPO', 'Reno'],
    'vivo': ['vivo'],
    'oneplus': ['OnePlus'],
    'huawei': ['Huawei'],
    'infinix': ['Infinix'],
    'tecno': ['Tecno'],
    'motorola': ['Moto'],
    'honor': ['Honor'],
    'nothing': ['Nothing'],
};

export default async function CategoryPage({ params }: Props) {
    let slug = '';
    let subcategory = '';
    let brand = '';

    try {
        const resolvedParams = await params;
        slug = resolvedParams.slug;
        subcategory = resolvedParams.subcategory;
        brand = resolvedParams.brand;
    } catch (e) {
        console.error('[CategoryPage] Params resolution error:', e);
        return <ErrorPage message="Invalid brand parameters" />;
    }

    try {
        const config = categoryConfig[slug] || { title: slug, Icon: Package, color: "from-primary/20 to-primary/10" };
        const subcategoryDisplay = subcategory.replace(/-/g, ' ');
        const brandDisplay = brand.charAt(0).toUpperCase() + brand.slice(1);

        // Get category by subcategory slug
        const supabase = await createSupabaseServerClient();
        const { data: category } = await supabase
            .from("categories")
            .select("id, slug, parent_id")
            .eq("slug", subcategory)
            .maybeSingle();


        let productIds: string[] = [];

        if (category) {
            // Get all child categories
            const { data: allCategories } = await supabase
                .from("categories")
                .select("id")
                .eq("parent_id", category.id);

            const categoryIds = [category.id, ...(allCategories?.map(c => c.id) || [])];

            // Get product IDs for these categories
            const { data: productCategories } = await supabase
                .from("product_categories")
                .select("product_id")
                .in("category_id", categoryIds);

            productIds = productCategories?.map(pc => pc.product_id) || [];
        }

        // Build brand filter
        const brandPatterns = brandKeywords[brand.toLowerCase()] || [brand];

        // Fetch products filtered by category and brand
        let products: any[] = [];

        if (productIds.length > 0) {
            // Filter by category IDs and brand
            const brandFilter = brandPatterns.map(p => `name.ilike.%${p}%`).join(',');
            const { data } = await supabase
                .from("products")
                .select("id, name, slug, thumbnail_url, nav_category, nav_subcategory, product_variants(price_kes)")
                .eq("is_active", true)
                .in("id", productIds)
                .or(brandFilter)
                .order("created_at", { ascending: false })
                .limit(50);
            products = data || [];
        } else {
            // Fallback to legacy behavior - just filter by brand
            const brandFilter = brandPatterns.map(p => `name.ilike.%${p}%`).join(',');
            const { data } = await supabase
                .from("products")
                .select("id, name, slug, thumbnail_url, nav_category, nav_subcategory, product_variants(price_kes)")
                .eq("is_active", true)
                .eq("nav_category", slug)
                .eq("nav_subcategory", subcategory)
                .or(brandFilter)
                .order("created_at", { ascending: false })
                .limit(50);
            products = data || [];
        }

        const productCount = products?.length || 0;

        return (
            <div className="min-h-screen bg-background">
                <div className="pt-[44px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Breadcrumb
                        items={[
                            { label: "Home", href: "/" },
                            { label: "Store", href: "/store" },
                            { label: config.title, href: `/category/${slug}` },
                            { label: subcategoryDisplay, href: `/category/${slug}/${subcategory}` },
                            { label: brandDisplay, href: `/category/${slug}/${subcategory}/${brand}` },
                        ]}
                    />

                    <div className="mt-8">
                        <div className={cn("rounded-3xl p-8 md:p-12 bg-gradient-to-br", config.color)}>
                            <div className="flex items-center gap-3 mb-4">
                                <config.Icon className="w-10 h-10 text-foreground" />
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{brandDisplay} {subcategoryDisplay}</h1>
                            </div>
                            <p className="text-lg text-muted-foreground">
                                Browse our collection of {brandDisplay} {subcategoryDisplay}
                            </p>
                            {productCount > 0 && <p className="mt-2 text-sm text-muted-foreground">{productCount} products available</p>}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-4">{productCount} Products</h2>

                        {products && products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map((product: { id: string; name: string; slug: string; thumbnail_url: string | null; product_variants: any[] | null }) => {
                                    const variants = product.product_variants || [];
                                    const prices = variants
                                        .map((v) => Number(v.price_kes))
                                        .filter((p) => !isNaN(p) && p > 0);
                                    
                                    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                                    return (
                                        <Link key={product.id} href={`/products/${product.slug}`} className="group block">
                                            <div className="aspect-square relative bg-muted rounded-xl overflow-hidden mb-4">
                                                {product.thumbnail_url ? (
                                                    <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Package className="w-12 h-12 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{minPrice > 0 ? formatKES(minPrice) : "Price on request"}</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No products found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('[CategoryPage] Error:', error);
        return <ErrorPage title="Brand Selection Error" message="We encountered an issue while loading results for this brand." />;
    }
}

import { ErrorPage } from "@/components/error-page";
