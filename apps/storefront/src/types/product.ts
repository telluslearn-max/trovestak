export type ProductType = "simple" | "variable" | "grouped" | "external" | "digital";
export type ProductStatus = "draft" | "published" | "archived" | "pending";
export type ProductVisibility = "catalog" | "search" | "hidden" | "featured";
export type StockStatus = "instock" | "outofstock" | "onbackorder";
export type AllowBackorders = "no" | "notify" | "yes";
export type TaxStatus = "taxable" | "none" | "shipping";
export type AttributeDisplayType = "dropdown" | "radio" | "checkbox" | "text";
export type AttributeType = "select" | "multiselect" | "text" | "color" | "boolean";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  category_id?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // New columns from migration (may not exist in all products)
  type?: ProductType;
  short_description?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  is_featured?: boolean;
  is_virtual?: boolean;
  is_downloadable?: boolean;
  author_id?: string;
  purchase_note?: string;
  regular_price?: number;
  cost_price?: number;
  sale_price?: number;
  sale_price_start?: string;
  sale_price_end?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: StockStatus;
  allow_backorders?: AllowBackorders;
  low_stock_threshold?: number;
  sold_individually?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  shipping_class_id?: string;
  tax_status?: TaxStatus;
  tax_class_id?: string;
  sku?: string;
  brand_type?: string;
  badge?: string;
  warranty?: string;
  nav_category?: string;
  nav_subcategory?: string;
  nav_section?: string;
  nav_url?: string;
  gallery_urls?: string[];
  seo_title?: string;
  seo_description?: string;
  min_price?: number;
  max_price?: number;
  total_sales?: number;
  average_rating?: number;
  review_count?: number;
  external_url?: string;
  button_text?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  description?: string;
  regular_price?: number;
  sale_price?: number;
  sale_price_start?: string;
  sale_price_end?: string;
  manage_stock: boolean;
  stock_quantity?: number;
  stock_status: StockStatus;
  allow_backorders: AllowBackorders;
  low_stock_threshold?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  is_virtual: boolean;
  is_downloadable: boolean;
  download_files: DownloadFile[];
  download_limit: number;
  download_expiry: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  attributes?: VariationAttribute[];
}

export interface DownloadFile {
  id: string;
  name: string;
  file_url: string;
  file_size?: number;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
  position: number;
  is_primary: boolean;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  display_mode?: string;
  filterable?: boolean;
  menu_order?: number;
  image_url?: string;
  thumbnail_url?: string;
  // Megamenu fields
  is_featured?: boolean;
  column_layout?: string;
  featured_product_id?: string;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface ProductTagLink {
  product_id: string;
  tag_id: string;
  tag?: ProductTag;
}

export interface ProductAttributeGroup {
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  display_type: AttributeDisplayType;
  position: number;
  created_at: string;
  terms?: ProductAttributeTerm[];
}

export interface ProductAttributeTerm {
  id: string;
  group_id: string;
  name: string;
  slug: string;
  value?: string;
  position: number;
  created_at: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  group_id?: string;
  term_id?: string;
  is_global: boolean;
  local_name?: string;
  local_value?: string;
  local_options?: string[];
  is_visible: boolean;
  is_variation: boolean;
  position: number;
  selected_term_id?: string;
  created_at: string;
  group?: ProductAttributeGroup;
  term?: ProductAttributeTerm;
}

export interface VariationAttribute {
  id: string;
  variation_id: string;
  attribute_id: string;
  term_id?: string;
  value?: string;
  attribute?: ProductAttribute;
  term?: ProductAttributeTerm;
}

export interface ProductPrice {
  id: string;
  product_id?: string;
  variation_id?: string;
  currency_code: string;
  regular_price: number;
  sale_price?: number;
  sale_price_start?: string;
  sale_price_end?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  variation_id?: string;
  media_asset_id?: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  position: number;
  file_type: string;
  file_url?: string;
  file_size?: number;
  created_at: string;
}

export interface ProductUpsell {
  id: string;
  product_id: string;
  upsell_product_id: string;
  position: number;
  created_at: string;
  upsell_product?: Product;
}

export interface ProductCrosssell {
  id: string;
  product_id: string;
  crosssell_product_id: string;
  position: number;
  created_at: string;
  crosssell_product?: Product;
}

export interface GroupedProduct {
  id: string;
  group_product_id: string;
  child_product_id: string;
  position: number;
  created_at: string;
  child_product?: Product;
}

export interface ShippingClass {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface TaxClass {
  id: string;
  name: string;
  slug: string;
  rate: number;
  is_default: boolean;
  created_at: string;
}

// Extended product with all relations (for single product fetch)
export interface ProductWithRelations extends Product {
  categories?: ProductCategory[];
  tags?: ProductTagLink[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  media?: ProductMedia[];
  prices?: ProductPrice[];
  upsells?: ProductUpsell[];
  crosssells?: ProductCrosssell[];
  grouped_products?: GroupedProduct[];
  shipping_class?: ShippingClass;
  tax_class?: TaxClass;
}

// Filter types
export interface ProductFilters {
  type?: ProductType;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  stock_status?: StockStatus;
  category_id?: string;
  brand_type?: string;
  is_featured?: boolean;
  search?: string;
  min_price?: number;
  max_price?: number;
}

export interface ProductSort {
  field: keyof Product;
  direction: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}
