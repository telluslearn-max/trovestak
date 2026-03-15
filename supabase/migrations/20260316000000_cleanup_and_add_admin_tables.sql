-- ============================================================
-- Trovestak DB Cleanup + Admin Tables
-- 2026-03-16
-- Removes dead tables/columns from mid-migration state.
-- Adds tables needed for admin dashboard functionality.
-- ============================================================

-- ============================================================
-- SECTION 1: DROP DEAD TABLES
-- (never queried in app code, replaced by canonical alternatives)
-- ============================================================

-- Unused financial/compliance stubs
DROP TABLE IF EXISTS kra_invoices CASCADE;
DROP TABLE IF EXISTS financial_records CASCADE;

-- Audit log tables with triggers but never queried
DROP TABLE IF EXISTS product_status_log CASCADE;
DROP TABLE IF EXISTS product_audit_log CASCADE;

-- Duplicate media table (media_assets is the canonical Cloudinary table)
DROP TABLE IF EXISTS media CASCADE;

-- Orphaned linking tables (replaced by product_variants.options JSONB)
DROP TABLE IF EXISTS variation_attributes CASCADE;

-- Never queried — replaced by product_upsells / product_crosssells
DROP TABLE IF EXISTS product_links CASCADE;

-- Orphaned variant systems (product_variants is canonical)
DROP TABLE IF EXISTS product_variants_detail CASCADE;
DROP TABLE IF EXISTS product_variations CASCADE;

-- Orphaned pricing table (product_pricing is canonical)
DROP TABLE IF EXISTS product_prices CASCADE;


-- ============================================================
-- SECTION 2: DROP REDUNDANT COLUMNS FROM products
-- (duplicated in product_pricing / product_variants, or unused)
-- ============================================================

ALTER TABLE products
  DROP COLUMN IF EXISTS regular_price,
  DROP COLUMN IF EXISTS sale_price_start,
  DROP COLUMN IF EXISTS sale_price_end,
  DROP COLUMN IF EXISTS manage_stock,
  DROP COLUMN IF EXISTS sold_individually,
  DROP COLUMN IF EXISTS shipping_class_id,
  DROP COLUMN IF EXISTS tax_status,
  DROP COLUMN IF EXISTS tax_class_id,
  DROP COLUMN IF EXISTS external_url,
  DROP COLUMN IF EXISTS button_text,
  DROP COLUMN IF EXISTS min_price,
  DROP COLUMN IF EXISTS max_price,
  DROP COLUMN IF EXISTS total_sales,
  DROP COLUMN IF EXISTS is_virtual,
  DROP COLUMN IF EXISTS is_downloadable,
  DROP COLUMN IF EXISTS author_id,
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS brand_type,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by;


-- ============================================================
-- SECTION 3: ADD MISSING TABLES (in dependency order)
-- ============================================================

-- 1. stock_log
-- Fixes broken updateStockAction() in inventory-actions.ts
CREATE TABLE IF NOT EXISTS stock_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_log_product_id ON stock_log(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_log_created_at ON stock_log(created_at DESC);


-- 2. discount_codes
-- checkout/actions.ts validates these — admin needs to create them
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_kes')),
  value NUMERIC NOT NULL,
  min_order_kes BIGINT DEFAULT 0,
  max_uses INT,
  uses_count INT DEFAULT 0,
  single_use_per_customer BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = true;


-- 3. flash_sales
CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  flash_price_kes BIGINT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_product_id ON flash_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active_time ON flash_sales(is_active, starts_at, ends_at);


-- 4. return_requests
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  reason TEXT,
  item_ids JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  resolution TEXT CHECK (resolution IN ('exchange', 'credit_note', 'refund')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);


-- 5. trade_in_valuations
CREATE TABLE IF NOT EXISTS trade_in_valuations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('mint', 'good', 'fair', 'poor', 'broken')),
  value_kes BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand, model_name, condition)
);

CREATE INDEX IF NOT EXISTS idx_trade_in_valuations_brand ON trade_in_valuations(brand);
CREATE INDEX IF NOT EXISTS idx_trade_in_valuations_active ON trade_in_valuations(is_active) WHERE is_active = true;


-- 6. riders
CREATE TABLE IF NOT EXISTS riders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  zone TEXT DEFAULT 'CBD',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riders_active ON riders(is_active) WHERE is_active = true;


-- 7. buysimu_schedules (BNPL)
-- Deposit: price * 0.40, financed_total: (price * 0.60) * 1.50, weekly: financed_total / 12
CREATE TABLE IF NOT EXISTS buysimu_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  deposit_kes BIGINT NOT NULL,
  weekly_payment_kes BIGINT NOT NULL,
  total_payments INT DEFAULT 12,
  payments_made INT DEFAULT 0,
  next_due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'complete', 'defaulted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buysimu_schedules_order_id ON buysimu_schedules(order_id);
CREATE INDEX IF NOT EXISTS idx_buysimu_schedules_status ON buysimu_schedules(status);


-- ============================================================
-- SECTION 4: EXTEND orders TABLE
-- (fulfillment, BNPL, trade-in, customer info columns)
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rider_name TEXT,
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS courier_ref TEXT,
  ADD COLUMN IF NOT EXISTS trade_in_credit_kes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bnpl_deposit_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bnpl_schedule_id UUID REFERENCES buysimu_schedules(id),
  ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'motorbike'
    CHECK (delivery_method IN ('motorbike', 'ebike', 'courier', 'pickup')),
  ADD COLUMN IF NOT EXISTS mpesa_phone TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_dispatched_at ON orders(dispatched_at) WHERE dispatched_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mpesa_receipt ON orders(mpesa_receipt_number) WHERE mpesa_receipt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);
