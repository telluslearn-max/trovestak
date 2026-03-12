-- Add brand and tags columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Grant permissions
GRANT SELECT ON products TO anon, authenticated;
GRANT UPDATE ON products TO authenticated;
