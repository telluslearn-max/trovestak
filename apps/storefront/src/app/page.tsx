import { HeroCarousel, ValueProps } from "@/components/hero-carousel";
import { FeaturedGrid } from "@/components/featured-grid";
import { BentoGrid } from "@/components/bento-card";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";


async function getFeaturedProducts() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_active", true)
      .limit(8);

    if (error) {
      console.error("[ Server ] Supabase error in getFeaturedProducts:", { message: error.message, code: error.code, details: error.details });
    }

    return products || [];
  } catch (error: any) {
    console.error("[ Server ] System error in getFeaturedProducts:", { message: error.message, code: error.code, details: error.details });
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="min-h-screen">
      <HeroCarousel />
      <ValueProps />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">
        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Handpicked for you</p>
            </div>
            <Link href="/store" className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <FeaturedGrid products={featuredProducts} />
          ) : (
            <div className="h-64 rounded-2xl bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">No products available yet.</p>
            </div>
          )}
          <div className="mt-6 md:hidden text-center">
            <Link href="/store" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Find what you need</p>
          </div>
          <BentoGrid />
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-yellow-300 rounded-full blur-3xl" />
          </div>
          <div className="relative px-8 py-16 md:py-20 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Your Gateway to Future-Ready Tech
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Discover Kenya&apos;s curated selection of premium electronics with official warranties and fast delivery.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/store" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                Shop Now
              </Link>
              <Link href="/deals" className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all hover:scale-105">
                View Deals
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-primary mb-1">10K+</div>
              <p className="text-sm text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <div className="text-3xl font-black text-primary mb-1">500+</div>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
            <div>
              <div className="text-3xl font-black text-primary mb-1">50+</div>
              <p className="text-sm text-muted-foreground">Brands</p>
            </div>
            <div>
              <div className="text-3xl font-black text-primary mb-1">24/7</div>
              <p className="text-sm text-muted-foreground">Support</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
