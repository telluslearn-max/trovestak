-- Migration: Add product data columns
-- Run this in Supabase SQL Editor

-- Add pricing columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS regular_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sell_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_start TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_end TIMESTAMPTZ;

-- Add product type
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'simple';

-- Add inventory columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'instock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorders TEXT DEFAULT 'no';

-- Add brand and tags
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;

-- Add advanced fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'catalog';
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS upsell_ids UUID[];

-- Create variations table for variable products
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    cost_price INTEGER,
    regular_price INTEGER,
    sell_price INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product links table
CREATE TABLE IF NOT EXISTS product_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    linked_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    link_type TEXT CHECK (link_type IN ('upsell', 'crosssell')),
    UNIQUE(product_id, linked_product_id, link_type)
);

-- Enable RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_links ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON product_variations TO authenticated;
GRANT ALL ON product_links TO authenticated;
