-- Returns products similar to those the session has viewed.
-- Uses the centroid of viewed product embeddings as the taste vector.
CREATE OR REPLACE FUNCTION get_recommendations(
    p_session_id UUID,
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
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
    WITH last_viewed AS (
        SELECT ue.product_id
        FROM   user_events ue
        WHERE  ue.session_id = p_session_id
          AND  ue.product_id IS NOT NULL
        ORDER BY ue.created_at DESC
        LIMIT 1
    ),
    taste_vector AS (
        SELECT p.embedding
        FROM   products p
        JOIN   last_viewed lv ON p.id = lv.product_id
        WHERE  p.embedding IS NOT NULL
    ),
    viewed_ids AS (
        SELECT DISTINCT product_id
        FROM   user_events
        WHERE  session_id = p_session_id
          AND  product_id IS NOT NULL
    )
    SELECT  p.id, p.name, p.brand, p.nav_category, p.sell_price, p.slug, p.images,
            1 - (p.embedding <=> tv.embedding) AS score
    FROM    products p, taste_vector tv
    WHERE   p.status = 'published'
      AND   p.embedding IS NOT NULL
      AND   p.id NOT IN (SELECT product_id FROM viewed_ids)
    ORDER BY p.embedding <=> tv.embedding
    LIMIT   p_limit;
$$;
