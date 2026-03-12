"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { interpretPostgresError, type ParsedError } from "@/lib/postgres-errors";
import type { Product, ProductVariation } from "@/types/product";

interface CreateProductData {
  name: string;
  slug?: string;
  type?: Product["type"];
  status?: Product["status"];
  description?: string;
  short_description?: string;
  regular_price?: number;
  sale_price?: number;
  sku?: string;
  stock_quantity?: number;
  manage_stock?: boolean;
  stock_status?: Product["stock_status"];
  category_id?: string;
  [key: string]: any;
}

interface UpdateProductData {
  name?: string;
  slug?: string;
  type?: Product["type"];
  status?: Product["status"];
  visibility?: Product["visibility"];
  description?: string;
  short_description?: string;
  regular_price?: number;
  sale_price?: number;
  sale_price_start?: string;
  sale_price_end?: string;
  sku?: string;
  stock_quantity?: number;
  manage_stock?: boolean;
  stock_status?: Product["stock_status"];
  allow_backorders?: Product["allow_backorders"];
  low_stock_threshold?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  is_virtual?: boolean;
  is_downloadable?: boolean;
  is_featured?: boolean;
  purchase_note?: string;
  external_url?: string;
  button_text?: string;
  seo_title?: string;
  seo_description?: string;
  brand_type?: string;
  badge?: string;
  warranty?: string;
  [key: string]: any;
}

interface CreateVariationData {
  product_id: string;
  name: string;
  sku?: string;
  regular_price?: number;
  stock_quantity?: number;
  manage_stock?: boolean;
  image_url?: string;
  attributes?: Array<{
    attribute_id: string;
    term_id?: string;
    value?: string;
  }>;
}

interface UpdateVariationData {
  name?: string;
  sku?: string;
  regular_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  manage_stock?: boolean;
  stock_status?: ProductVariation["stock_status"];
  allow_backorders?: ProductVariation["allow_backorders"];
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  image_url?: string;
  is_virtual?: boolean;
  is_downloadable?: boolean;
}

interface MutationState<T> {
  loading: boolean;
  error: ParsedError | null;
  data: T | null;
}

export function useProductMutations() {
  const [createState, setCreateState] = useState<MutationState<Product>>({
    loading: false,
    error: null,
    data: null,
  });

  const [updateState, setUpdateState] = useState<MutationState<Product>>({
    loading: false,
    error: null,
    data: null,
  });

  const [deleteState, setDeleteState] = useState<MutationState<void>>({
    loading: false,
    error: null,
    data: null,
  });

  // Create product
  const createProduct = useCallback(async (data: CreateProductData) => {
    setCreateState({ loading: true, error: null, data: null });

    try {
      // Generate slug if not provided
      const slug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const { data: product, error: createError } = await supabase
        .from("products")
        .insert({
          ...data,
          slug,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (createError) {
        const parsedError = interpretPostgresError(createError);
        setCreateState({ loading: false, error: parsedError, data: null });
        return { error: parsedError };
      }

      setCreateState({ loading: false, error: null, data: product });
      return { data: product };
    } catch (err: any) {
      const parsedError: ParsedError = {
        message: err.message || "Failed to create product",
        code: err.code || "UNKNOWN",
      };
      setCreateState({ loading: false, error: parsedError, data: null });
      return { error: parsedError };
    }
  }, []);

  // Update product
  const updateProduct = useCallback(
    async (id: string, data: UpdateProductData) => {
      setUpdateState({ loading: true, error: null, data: null });

      try {
        const { data: product, error: updateError } = await supabase
          .from("products")
          .update({
            ...data,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

      if (updateError) {
        const parsedError = interpretPostgresError(updateError);
        setUpdateState({ loading: false, error: parsedError, data: null });
        return { error: parsedError };
      }

      setUpdateState({ loading: false, error: null, data: product });
      return { data: product };
    } catch (err: any) {
      const parsedError: ParsedError = {
        message: err.message || "Failed to update product",
        code: err.code || "UNKNOWN",
      };
      setUpdateState({ loading: false, error: parsedError, data: null });
      return { error: parsedError };
    }
  },
  []
  );

  // Soft delete product (archive)
  const archiveProduct = useCallback(async (id: string) => {
    setDeleteState({ loading: true, error: null, data: null });

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .update({
          status: "archived",
          deleted_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", id);

      if (deleteError) {
        const parsedError = interpretPostgresError(deleteError);
        setDeleteState({ loading: false, error: parsedError, data: null });
        return { error: parsedError };
      }

      setDeleteState({ loading: false, error: null, data: undefined });
      return { success: true };
    } catch (err: any) {
      const parsedError: ParsedError = {
        message: err.message || "Failed to archive product",
        code: err.code || "UNKNOWN",
      };
      setDeleteState({ loading: false, error: parsedError, data: null });
      return { error: parsedError };
    }
  }, []);

  // Permanently delete product
  const deleteProduct = useCallback(async (id: string) => {
    setDeleteState({ loading: true, error: null, data: null });

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) {
        const parsedError = interpretPostgresError(deleteError);
        setDeleteState({ loading: false, error: parsedError, data: null });
        return { error: parsedError };
      }

      setDeleteState({ loading: false, error: null, data: undefined });
      return { success: true };
    } catch (err: any) {
      const parsedError: ParsedError = {
        message: err.message || "Failed to delete product",
        code: err.code || "UNKNOWN",
      };
      setDeleteState({ loading: false, error: parsedError, data: null });
      return { error: parsedError };
    }
  }, []);

  // Update status (publish/unpublish)
  const updateStatus = useCallback(
    async (id: string, status: Product["status"]) => {
      return updateProduct(id, { status });
    },
    [updateProduct]
  );

  // Bulk update status
  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: Product["status"]) => {
      try {
        const { error: updateError } = await supabase
          .from("products")
          .update({ status })
          .in("id", ids);

        if (updateError) {
          const parsedError = interpretPostgresError(updateError);
          return { error: parsedError };
        }

        return { success: true };
      } catch (err: any) {
        return { error: { message: err.message, code: err.code || "UNKNOWN" } };
      }
    },
    []
  );

  // Bulk archive
  const bulkArchive = useCallback(async (ids: string[]) => {
    try {
      const { error: updateError } = await supabase
        .from("products")
        .update({ status: "archived", deleted_at: new Date().toISOString() })
        .in("id", ids);

      if (updateError) {
        const parsedError = interpretPostgresError(updateError);
        return { error: parsedError };
      }

      return { success: true };
    } catch (err: any) {
      return { error: { message: err.message, code: err.code || "UNKNOWN" } };
    }
  }, []);

  return {
    // Create
    createProduct,
    createLoading: createState.loading,
    createError: createState.error,
    createData: createState.data,

    // Update
    updateProduct,
    updateLoading: updateState.loading,
    updateError: updateState.error,
    updateData: updateState.data,

    // Delete
    archiveProduct,
    deleteProduct,
    deleteLoading: deleteState.loading,
    deleteError: deleteState.error,

    // Convenience methods
    updateStatus,
    bulkUpdateStatus,
    bulkArchive,
  };
}

// Separate hook for variation mutations
export function useVariationMutations() {
  // Create variation
  const createVariation = useCallback(
    async (data: CreateVariationData) => {
      try {
        const { data: variation, error: createError } = await supabase
          .from("product_variations")
          .insert({
            ...data,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (createError) {
          const parsedError = interpretPostgresError(createError);
          return { error: parsedError };
        }

        // Insert variation attributes if provided
        if (data.attributes && data.attributes.length > 0) {
          const attrInserts = data.attributes.map((attr) => ({
            variation_id: variation.id,
            attribute_id: attr.attribute_id,
            term_id: attr.term_id,
            value: attr.value,
          }));

          await supabase.from("variation_attributes").insert(attrInserts);
        }

        return { data: variation };
      } catch (err: any) {
        return { error: { message: err.message, code: err.code || "UNKNOWN" } };
      }
    },
    []
  );

  // Update variation
  const updateVariation = useCallback(
    async (id: string, data: UpdateVariationData) => {
      try {
        const { data: variation, error: updateError } = await supabase
          .from("product_variations")
          .update({
            ...data,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          const parsedError = interpretPostgresError(updateError);
          return { error: parsedError };
        }

        return { data: variation };
      } catch (err: any) {
        return { error: { message: err.message, code: err.code || "UNKNOWN" } };
      }
    },
    []
  );

  // Delete variation
  const deleteVariation = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("product_variations")
        .delete()
        .eq("id", id);

      if (deleteError) {
        const parsedError = interpretPostgresError(deleteError);
        return { error: parsedError };
      }

      return { success: true };
    } catch (err: any) {
      return { error: { message: err.message, code: err.code || "UNKNOWN" } };
    }
  }, []);

  // Bulk update variations (price/stock)
  const bulkUpdateVariations = useCallback(
    async (
      ids: string[],
      data: { regular_price?: number; stock_quantity?: number }
    ) => {
      try {
        const { error: updateError } = await supabase
          .from("product_variations")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .in("id", ids);

        if (updateError) {
          const parsedError = interpretPostgresError(updateError);
          return { error: parsedError };
        }

        return { success: true };
      } catch (err: any) {
        return { error: { message: err.message, code: err.code || "UNKNOWN" } };
      }
    },
    []
  );

  // Generate variations from attribute combinations
  const generateVariations = useCallback(
    async (productId: string, attributes: Array<{ attribute_id: string; term_ids: string[] }>) => {
      try {
        // Get attribute details
        const { data: attrs } = await supabase
          .from("product_attributes")
          .select(
            `
            *,
            group:product_attribute_groups(name, slug),
            term:product_attribute_terms(name, slug, value)
            `
          )
          .eq("product_id", productId)
          .eq("is_variation", true);

        if (!attrs || attrs.length === 0) {
          return { error: { message: "No variation attributes found", code: "NO_VARS" } };
        }

        // Generate all combinations
        const combinations: Array<Record<string, string>> = [{}];

        for (const attr of attrs) {
          const newCombinations: Array<Record<string, string>> = [];
          const terms = attr.term_id
            ? [{ id: attr.term_id, name: attr.term?.name || "", value: attr.term?.value || "" }]
            : (attr.local_options || []).map((opt: string) => ({ id: opt, name: opt, value: opt }));

          for (const combo of combinations) {
            for (const term of terms) {
              newCombinations.push({
                ...combo,
                [attr.local_name || attr.group?.name || attr.id]: term.name,
                [`${attr.local_name || attr.group?.name || attr.id}_id`]: term.id,
              });
            }
          }
          combinations.length = 0;
          combinations.push(...newCombinations);
        }

        // Create variations
        const variations = [];
        for (const combo of combinations) {
          const name = Object.entries(combo)
            .filter(([k]) => !k.endsWith("_id"))
            .map(([, v]) => v)
            .join(" / ");

          const { data: variation, error: varError } = await supabase
            .from("product_variations")
            .insert({
              product_id: productId,
              name,
              sku: `${productId.slice(0, 8)}-${variations.length + 1}`,
            })
            .select()
            .single();

          if (varError) continue;

          variations.push(variation);
        }

        return { data: variations };
      } catch (err: any) {
        return { error: { message: err.message, code: err.code || "UNKNOWN" } };
      }
    },
    []
  );

  return {
    createVariation,
    updateVariation,
    deleteVariation,
    bulkUpdateVariations,
    generateVariations,
  };
}
