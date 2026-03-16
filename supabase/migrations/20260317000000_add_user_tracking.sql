-- Behavioral event log
CREATE TABLE IF NOT EXISTS public.user_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  TEXT NOT NULL,
    event_type  TEXT NOT NULL CHECK (event_type IN ('view','scroll','search','add_cart','purchase')),
    product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category_id TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_events_session_created_idx ON public.user_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_session_category_idx ON public.user_events (session_id, category_id);

-- Inferred preference summary (upserted by getConciergeContextTool)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  TEXT UNIQUE NOT NULL,
    categories  TEXT[] DEFAULT '{}',
    brands      TEXT[] DEFAULT '{}',
    budget_min  INTEGER,
    budget_max  INTEGER,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ML affinity scores (upserted by get_recommendations RPC)
CREATE TABLE IF NOT EXISTS public.user_taste_profiles (
    session_id   TEXT NOT NULL,
    category_id  TEXT NOT NULL,
    affinity     FLOAT NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (session_id, category_id)
);
