import { createSupabaseServerClient } from "@/lib/supabase-server";
import SEOToolsClient from "./seo-tools-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "SEO Tools | Trovestak Admin",
    description: "Search engine optimization across catalog.",
};

export default async function AdminSEOToolsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch products with missing SEO metadata
    const { data: allProducts, count, error } = await supabase
        .from("products")
        .select("id, name, sku, meta_title, meta_description", { count: "exact" })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching products for SEO:", error);
    }

    const products = allProducts || [];
    const missingProducts = products.filter(p => !p.meta_title || !p.meta_description);

    return (
        <SEOToolsClient
            products={missingProducts.slice(0, 20)}
            totalIndexed={count || products.length}
            totalMissing={missingProducts.length}
        />
    );
}
