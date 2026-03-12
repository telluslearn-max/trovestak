// ============================================
// SHARED TYPES - Product Schema
// ============================================

export interface Product {
  id?: string;
  name: string;
  slug: string;
  short_name?: string;
  subtitle?: string;
  description?: string;
  nav_category?: string;
  nav_subcategory?: string;
  nav_section?: string;
  nav_url?: string;
  brand_type?: string;
  badge?: string;
  warranty?: string;
  availability?: 'in_stock' | 'limited' | 'preorder' | 'out_of_stock';
  seo_title?: string;
  seo_description?: string;
  thumbnail_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPricing {
  id?: string;
  product_id: string;
  cost_price: number;
  sell_price: number;
  discount_percent: number;
  compare_price?: number;
  currency?: string;
  price_history?: PriceHistoryEntry[];
}

export interface PriceHistoryEntry {
  price: number;
  changed_at: string;
  changed_by?: string;
  reason?: string;
}

export interface ProductVariant {
  id?: string;
  product_id: string;
  variant_type: 'color' | 'size' | 'storage' | 'tier' | 'connectivity';
  variant_name: string;
  hex_primary?: string;
  hex_secondary?: string;
  price_delta: number;
  is_default: boolean;
  is_available: boolean;
}

export interface ProductSpecs {
  id?: string;
  product_id: string;
  spec_category?: string;
  spec_data: Record<string, Record<string, string>>;
}

export interface ProductContent {
  id?: string;
  product_id: string;
  overview?: string;
  features?: ProductFeature[];
  faq?: FAQItem[];
  gallery?: string[];
}

export interface ProductFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface ProductAddon {
  id?: string;
  product_id: string;
  addon_type: 'bnpl' | 'trade_in' | 'shipping' | 'insurance';
  is_enabled: boolean;
  config?: Record<string, unknown>;
}

export interface MegamenuCategory {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
  megamenu_config?: Record<string, unknown>;
}

// ============================================
// INPUT SCHEMA (Section 15 Compliant)
// ============================================

export interface ProductInput {
  product: {
    name: string;
    short_name?: string;
    subtitle?: string;
    category: string;
    subcategory: string;
    brand_type: string;
    badge?: string;
    warranty?: string;
  };
  pricing: {
    cost_price: number;
    sell_price: number;
    discount_percent?: number;
    compare_price?: number;
    currency?: string;
  };
  availability: 'in_stock' | 'limited' | 'preorder' | 'out_of_stock';
  variants: {
    colors?: Array<{ name: string; hex: string; hex2?: string }>;
    sizes?: string[];
    tiers?: Array<{
      label: string;
      desc: string;
      price: number;
      is_default?: boolean;
    }>;
  };
  addons: {
    bnpl?: boolean;
    trade_in?: boolean;
    trade_in_devices?: Array<{
      group: string;
      items: Array<{ name: string; value: number }>;
    }>;
    shipping?: boolean;
    same_day_available?: boolean;
    insurance?: boolean;
  };
  content: {
    overview?: string;
    features?: ProductFeature[];
    specs?: Record<string, Record<string, string>>;
    faq?: FAQItem[];
  };
  breadcrumb?: string[];
}

// ============================================
// MEGAMENU STRUCTURE
// ============================================

export interface MegamenuStructure {
  categories: MegamenuCategory[];
  subcategories: Record<string, MegamenuCategory[]>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ProductsListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductDetailResponse {
  product: Product;
  pricing: ProductPricing;
  variants: {
    colors: ProductVariant[];
    sizes: ProductVariant[];
    tiers: ProductVariant[];
  };
  specs: ProductSpecs;
  content: ProductContent;
  addons: ProductAddon[];
  breadcrumb: string[];
}

export interface CategoriesResponse {
  categories: MegamenuCategory[];
}
