-- ============================================
-- Add missing price columns to products table
-- Date: 2026-02-26
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sell_price INTEGER;

-- Grant permissions
GRANT SELECT ON products TO anon, authenticated;
GRANT UPDATE ON products TO authenticated;
