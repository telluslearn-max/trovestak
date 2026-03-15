import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatKES } from "@/lib/formatters";

import { Breadcrumb } from "@/components/Breadcrumb";
import Link from "next/link";
import Image from "next/image";
import { Package, Smartphone, Laptop, Headphones, Gamepad2, Camera, Watch, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string; subcategory: string }>;
    searchParams: Promise<{ brand?: string }>;
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

export default async function CategoryPage(props: Props) {
    let slug = '';
    let subcategory = '';
    let brand: string | undefined = undefined;

    try {
        const params = await props.params;
        slug = params.slug;
        subcategory = params.subcategory;
        const sp = await props.searchParams;
        brand = sp?.brand;
    } catch (e) {
        console.error('[CategoryPage] Params resolution error:', e);
        return <ErrorPage message="Invalid subcategory parameters" />;
    }

    try {
        const config = categoryConfig[slug] || { title: slug, Icon: Package, color: "from-primary/20 to-primary/10" };
        const subcategoryDisplay = subcategory.replace(/-/g, ' ');

        // Get subcategory by slug
        const supabase = await createSupabaseServerClient();
        const { data: category } = await supabase
            .from("categories")
            .select("id, slug, parent_id")
            .eq("slug", subcategory)
            .maybeSingle();


        let productIds: string[] = [];

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

            productIds = productCategories?.map(pc => pc.product_id) || [];
        }

        // Fetch products filtered by category
        let products: any[] = [];
        if (productIds.length > 0) {
            let query = supabase
                .from("products")
                .select("id, name, slug, thumbnail_url, nav_category, nav_subcategory, product_variants(price_kes)")
                .eq("status", "published")
                .in("id", productIds)
                .order("created_at", { ascending: false })
                .limit(50);

            if (brand) {
                query = query.ilike("name", `%${brand}%`);
            }

            const { data } = await query;
            products = data || [];
        } else {
            let query = supabase
                .from("products")
                .select("id, name, slug, thumbnail_url, nav_category, nav_subcategory, product_variants(price_kes)")
                .eq("status", "published")
                .eq("nav_subcategory", subcategory)
                .order("created_at", { ascending: false })
                .limit(50);

            if (brand) {
                query = query.ilike("name", `%${brand}%`);
            }

            const { data } = await query;
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
                            { label: subcategoryDisplay, href: `/category/${slug}/${subcategory}${brand ? `?brand=${brand}` : ''}` },
                            ...(brand ? [{ label: brand, href: `/category/${slug}/${subcategory}?brand=${brand}` }] : []),
                        ]}
                    />

                    <div className="mt-8">
                        <div className={cn("rounded-3xl p-8 md:p-12 bg-gradient-to-br", config.color)}>
                            <div className="flex items-center gap-3 mb-4">
                                <config.Icon className="w-10 h-10 text-foreground" />
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                    {brand ? `${brand} ` : ''}{subcategoryDisplay}
                                </h1>
                            </div>
                            <p className="text-lg text-muted-foreground">
                                Browse our collection of {subcategoryDisplay} {config.title.toLowerCase()}
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
                                        <Link key={product.id} href={`/products/${product.slug}`} className="group block cursor-pointer">
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
                                <p className="text-muted-foreground">Try adjusting your filters or browse other categories</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('[CategoryPage] Error:', error);
        return <ErrorPage title="Subcategory Error" message="We encountered an issue while loading this subcategory." />;
    }
}

import { ErrorPage } from "@/components/error-page";
