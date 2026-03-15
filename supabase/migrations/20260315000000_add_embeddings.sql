-- ============================================
-- Add pgvector embeddings to products table
-- Bible §6.1 — Semantic search via text-embedding-004 (768-dim)
-- ============================================

-- Enable pgvector extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- IVFFlat index for fast approximate nearest-neighbour search
-- lists=100 is a good starting point for ~175 products (can increase as catalog grows)
CREATE INDEX IF NOT EXISTS idx_products_embedding
ON public.products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ── match_products RPC ────────────────────────────────────────────────────────
-- Called by search_products tool in agent-service
-- Returns products ordered by cosine similarity to the query embedding
CREATE OR REPLACE FUNCTION public.match_products(
    query_embedding  vector(768),
    match_threshold  float    DEFAULT 0.4,
    match_count      int      DEFAULT 5,
    filter_category  text     DEFAULT NULL
)
RETURNS TABLE (
    id          uuid,
    name        text,
    brand       text,
    nav_category text,
    sell_price  numeric,
    slug        text,
    images      text[],
    similarity  float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        p.id,
        p.name,
        p.brand,
        p.nav_category,
        p.sell_price,
        p.slug,
        p.images,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM public.products p
    WHERE
        p.status = 'published'
        AND p.embedding IS NOT NULL
        AND 1 - (p.embedding <=> query_embedding) > match_threshold
        AND (filter_category IS NULL OR p.nav_category ILIKE filter_category)
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Grant access to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.match_products TO anon, authenticated, service_role;
