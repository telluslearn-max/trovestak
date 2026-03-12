import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductPageClient from './ProductPageClient'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
        .from('products')
        .select('name, description, thumbnail_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!data) return { title: 'Product Not Found — Trovestak' }
    return {
        title: `${data.name} — Trovestak`,
        description: data.description ?? undefined,
        openGraph: {
            title: `${data.name} — Trovestak`,
            description: data.description ?? undefined,
            images: data.thumbnail_url ? [data.thumbnail_url] : [],
        },
    }
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (productError || !product) {
        console.error('Product fetch error:', productError)
        notFound()
    }

    const { data: variants } = await supabase
        .from('product_variants')
        .select('id, name, price_kes, stock_quantity, options, sku')
        .eq('product_id', product.id)
        .order('price_kes', { ascending: true })

    const { data: pricing } = await supabase
        .from('product_pricing')
        .select('*')
        .eq('product_id', product.id)
        .maybeSingle()

    const { data: specs } = await supabase
        .from('product_specs')
        .select('*')
        .eq('product_id', product.id)
        .maybeSingle()

    const { data: content } = await supabase
        .from('product_content')
        .select('*')
        .eq('product_id', product.id)
        .maybeSingle()

    const { data: addons } = await supabase
        .from('product_addons')
        .select('*')
        .eq('product_id', product.id)

    // ── Pre-fetch Reviews ───────────────────────────────────────────────────
    const { data: reviews } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10)

    // ── Pre-fetch Related Products ─────────────────────────────────────────
    let relatedProducts: any[] = []
    if (product.nav_category) {
        const { data: related } = await supabase
            .from('products')
            .select('id, name, slug, thumbnail_url, brand_type, product_variants(price_kes)')
            .eq('is_active', true)
            .eq('nav_category', product.nav_category)
            .neq('id', product.id)
            .order('created_at', { ascending: false })
            .limit(4)
        relatedProducts = related || []
    }

    return <ProductPageClient
        product={product}
        variants={variants ?? []}
        pricing={pricing}
        specs={specs?.spec_data ?? null}
        content={content}
        addons={addons ?? []}
        initialReviews={reviews ?? []}
        initialRelated={relatedProducts}
    />
}
