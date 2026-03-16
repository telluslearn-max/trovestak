-- Update get_recommendations RPC:
--   1. session_id type: UUID → TEXT (matches browser crypto.randomUUID() passed as text)
--   2. Preference boost: products from user's top categories score ×1.3
--   3. Cold start: if no viewed products, fall back to preferred-category products
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
LANGUAGE plpgsql STABLE
SET search_path = public, extensions
AS $$
DECLARE
    v_taste  vector(768);
    v_prefs  TEXT[];
BEGIN
    -- Taste vector: embedding of last viewed product
    SELECT p.embedding INTO v_taste
    FROM   user_events ue
    JOIN   products p ON p.id = ue.product_id
    WHERE  ue.session_id = p_session_id
      AND  p.embedding IS NOT NULL
    ORDER  BY ue.created_at DESC
    LIMIT  1;

    -- Preferred categories from inferred taste profile
    SELECT categories INTO v_prefs
    FROM   user_preferences
    WHERE  session_id = p_session_id;

    -- Cold start: no viewed products with embeddings
    IF v_taste IS NULL THEN
        RETURN QUERY
        SELECT  p.id, p.name, p.brand, p.nav_category, p.sell_price, p.slug,
                p.images, 0.0::FLOAT AS score
        FROM    products p
        WHERE   p.status = 'published'
          AND   (v_prefs IS NULL OR p.nav_category = ANY(v_prefs))
        ORDER   BY p.created_at DESC
        LIMIT   p_limit;
        RETURN;
    END IF;

    -- Warm path: embedding similarity + 30% boost for preferred categories
    RETURN QUERY
    SELECT  p.id, p.name, p.brand, p.nav_category, p.sell_price, p.slug,
            p.images,
            (1 - (p.embedding <=> v_taste)) *
                CASE WHEN v_prefs IS NOT NULL AND p.nav_category = ANY(v_prefs)
                     THEN 1.3 ELSE 1.0 END AS score
    FROM    products p
    WHERE   p.status = 'published'
      AND   p.embedding IS NOT NULL
      AND   p.id NOT IN (
                SELECT DISTINCT product_id
                FROM   user_events
                WHERE  session_id = p_session_id
                  AND  product_id IS NOT NULL
            )
    ORDER   BY score DESC
    LIMIT   p_limit;
END;
$$;
