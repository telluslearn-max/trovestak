import type { PostgrestError } from "@supabase/supabase-js";

export interface ConstraintMapping {
  field: string;
  message: string;
}

export interface ErrorMap {
  [constraintName: string]: ConstraintMapping;
}

export const CONSTRAINT_ERROR_MAP: ErrorMap = {
  // Products
  products_sku_key: {
    field: "sku",
    message: "This SKU is already in use by another product",
  },
  products_slug_key: {
    field: "slug",
    message: "This URL slug is already in use by another product",
  },
  
  // Product Variations
  product_variations_sku_key: {
    field: "sku",
    message: "This SKU is already in use by another variation",
  },
  product_variations_product_id_sku_key: {
    field: "sku",
    message: "This SKU is already in use by another variation of this product",
  },
  
  // Categories
  categories_slug_key: {
    field: "slug",
    message: "This URL slug is already in use by another category",
  },
  
  // Product Tags
  product_tags_slug_key: {
    field: "slug",
    message: "This slug is already in use by another tag",
  },
  
  // Attribute Groups
  product_attribute_groups_slug_key: {
    field: "slug",
    message: "This slug is already in use by another attribute group",
  },
  
  // Attribute Terms
  product_attribute_terms_group_id_slug_key: {
    field: "slug",
    message: "This value is already in use by another term in this group",
  },
  
  // Shipping Classes
  shipping_classes_slug_key: {
    field: "slug",
    message: "This slug is already in use by another shipping class",
  },
  
  // Tax Classes
  tax_classes_slug_key: {
    field: "slug",
    message: "This slug is already in use by another tax class",
  },
  
  // Product Categories (relationship)
  product_categories_pkey: {
    field: "category",
    message: "This category is already assigned to this product",
  },
  
  // Product Tags (relationship)
  product_tags_pkey: {
    field: "tag",
    message: "This tag is already assigned to this product",
  },
  
  // Product Upsells
  product_upsells_pkey: {
    field: "upsell_product_id",
    message: "This product is already linked as an upsell",
  },
  
  // Product Crosssells
  product_crosssells_pkey: {
    field: "crosssell_product_id",
    message: "This product is already linked as a cross-sell",
  },
  
  // Grouped Products
  grouped_products_pkey: {
    field: "child_product_id",
    message: "This product is already in the group",
  },
};

export interface ParsedError {
  field?: string;
  message: string;
  code: string;
  details?: string;
}

export function interpretPostgresError(error: PostgrestError): ParsedError {
  // Handle unique constraint violations (23505)
  if (error.code === "23505") {
    const mapping = CONSTRAINT_ERROR_MAP[(error as any).constraint];
    if (mapping) {
      return {
        field: mapping.field,
        message: mapping.message,
        code: error.code,
        details: error.details,
      };
    }
    // Fallback for unknown constraints
    return {
      message: `This value is already in use`,
      code: error.code,
      details: error.details,
    };
  }

  // Handle check constraint violations (23514)
  if (error.code === "23514") {
    return {
      message: error.hint || "Invalid value for this field",
      code: error.code,
      details: error.details,
    };
  }

  // Handle not null violations (23502)
  if (error.code === "23502") {
    const field = (error as any).column?.replace(/_/g, " ") || "field";
    return {
      message: `${field} is required`,
      code: error.code,
      details: error.details,
    };
  }

  // Handle foreign key violations (23503)
  if (error.code === "23503") {
    return {
      message: "Referenced record does not exist",
      code: error.code,
      details: error.details,
    };
  }

  // Default fallback
  return {
    message: error.message || "An error occurred",
    code: error.code || "UNKNOWN",
    details: error.details,
  };
}

export function formatValidationErrors(
  errors: Record<string, string>
): Array<{ field: string; message: string }> {
  return Object.entries(errors).map(([field, message]) => ({
    field,
    message,
  }));
}
