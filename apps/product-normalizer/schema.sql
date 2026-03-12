-- Migration: Add product name normalization columns
-- Run this in your Supabase SQL editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS normalized_name TEXT,
ADD COLUMN IF NOT EXISTS name_normalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS name_normalization_reasoning TEXT;

-- Create index for efficient querying of unprocessed products
CREATE INDEX IF NOT EXISTS idx_products_normalized_name 
ON products(normalized_name) 
WHERE normalized_name IS NULL;

-- Optional: Create function to manually trigger normalization via webhook
-- This can be called from Supabase Edge Functions or external schedulers
