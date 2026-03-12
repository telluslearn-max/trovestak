-- Create migration to add images column to products
-- Run this in Supabase SQL editor
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
