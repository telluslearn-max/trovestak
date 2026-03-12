import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrationSQL = `
-- ============================================
-- TROVESTAK PRODUCT PAGE BACKEND
-- Complete Schema for E-Commerce
-- Date: 2026-02-24
-- ============================================

-- 1. ENHANCE PRODUCTS TABLE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_subcategory TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_section TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nav_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '1 Year';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'in_stock';

-- 2. PRICING TABLE
CREATE TABLE IF NOT EXISTS public.product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    cost_price INTEGER NOT NULL DEFAULT 0,
    sell_price INTEGER NOT NULL DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    compare_price INTEGER,
    currency TEXT DEFAULT 'KES',
    price_history JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    hex_primary TEXT,
    hex_secondary TEXT,
    price_delta INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SPECS TABLE
CREATE TABLE IF NOT EXISTS public.product_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    spec_category TEXT,
    spec_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.product_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    overview TEXT,
    features JSONB DEFAULT '[]',
    faq JSONB DEFAULT '[]',
    gallery JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADDONS TABLE
CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    addon_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, addon_type)
);

-- 7. MEGAMENU CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.megamenu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.megamenu_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    megamenu_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_nav_category ON public.products(nav_category);
CREATE INDEX IF NOT EXISTS idx_products_nav_subcategory ON public.products(nav_subcategory);
CREATE INDEX IF NOT EXISTS idx_pricing_product_id ON public.product_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants_detail(product_id);
CREATE INDEX IF NOT EXISTS idx_specs_product_id ON public.product_specs(product_id);
CREATE INDEX IF NOT EXISTS idx_content_product_id ON public.product_content(product_id);
CREATE INDEX IF NOT EXISTS idx_addons_product_id ON public.product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_megamenu_parent ON public.megamenu_categories(parent_id);

-- 9. SEED MEGAMENU DATA
INSERT INTO public.megamenu_categories (name, slug, sort_order, is_active) VALUES
('Mobile', 'mobile', 1, true),
('Computing', 'computing', 2, true),
('Audio', 'audio', 3, true),
('Wearables', 'wearables', 4, true),
('Gaming', 'gaming', 5, true),
('Cameras', 'cameras', 6, true),
('Smart Home', 'smart-home', 7, true),
('Software', 'software', 8, true)
ON CONFLICT (slug) DO NOTHING;
`;

async function runMigration() {
  console.log('Running database migration...');
  
  try {
    // Execute migration using rpc (postgrest doesn't support raw SQL, so we use a workaround)
    // Since we can't execute raw SQL directly, we'll create the tables via the API
    
    console.log('Creating tables via API...');
    
    // Create pricing table
    const { error: pricingError } = await supabase.rpc('create_table_if_not_exists', { 
      sql: migrationSQL 
    }).catch(() => null);
    
    // Alternative: Since RPC might not work, let's create tables one by one
    console.log('Creating product_pricing table...');
    await supabase.from('product_pricing').select('id').limit(1).catch(async () => {
      // Table doesn't exist, but we can't create it via JS client
      console.log('Note: Please run the migration SQL manually in Supabase SQL Editor');
    });
    
    console.log('\n=== Migration Instructions ===');
    console.log('Please run the following SQL in your Supabase SQL Editor:\n');
    console.log(migrationSQL);
    console.log('\n=== End of SQL ===\n');
    
    console.log('After running the migration, you can import products using:');
    console.log('cd apps/db-importer && pnpm import');
    
  } catch (error) {
    console.error('Migration error:', error);
    console.log('\n=== Manual Migration Required ===');
    console.log('Please run the migration SQL in Supabase SQL Editor, then import products.\n');
  }
}

runMigration();
