-- Returns products similar to those the session has viewed.
-- Uses the centroid of viewed product embeddings as the taste vector.
CREATE OR REPLACE FUNCTION get_recommendations(
    p_session_id TEXT,
    p_limit       INT DEFAULT 5
)
RETURNS TABLE (
    id           UUID,
    name         TEXT,
    brand        TEXT,
    nav_category TEXT,
    sell_price   NUMERIC,
    slug         TEXT,
    images       TEXT[],
    score        FLOAT
)
LANGUAGE sql STABLE AS $$
    WITH viewed AS (
        SELECT DISTINCT ue.product_id, p.embedding
        FROM   user_events ue
        JOIN   products p ON p.id = ue.product_id
        WHERE  ue.session_id = p_session_id
          AND  ue.product_id IS NOT NULL
          AND  p.embedding IS NOT NULL
    ),
    avg_emb AS (
        SELECT avg(embedding) AS centroid FROM viewed
    )
    SELECT  p.id, p.name, p.brand, p.nav_category, p.sell_price, p.slug, p.images,
            1 - (p.embedding <=> ae.centroid) AS score
    FROM    products p, avg_emb ae
    WHERE   p.status = 'published'
      AND   p.embedding IS NOT NULL
      AND   p.id NOT IN (SELECT product_id FROM viewed WHERE product_id IS NOT NULL)
    ORDER BY p.embedding <=> ae.centroid
    LIMIT   p_limit;
$$;
