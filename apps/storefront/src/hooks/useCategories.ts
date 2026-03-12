"use client";

import { useState, useEffect, useCallback } from "react";
import { getCategories, upsertCategory, deleteCategory } from "@/app/admin/actions";
import { interpretPostgresError, type ParsedError } from "@/lib/postgres-errors";
import type { Category } from "@/types/product";

interface UseCategoriesOptions {
  parentId?: string | null;
  activeOnly?: boolean;
  enabled?: boolean;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { parentId, activeOnly = true, enabled = true } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { categories: allCategories } = await getCategories();

      let filtered = allCategories;

      if (parentId === null) {
        filtered = filtered.filter(c => !c.parent_id);
      } else if (parentId) {
        filtered = filtered.filter(c => c.parent_id === parentId);
      }

      if (activeOnly) {
        filtered = filtered.filter(c => c.is_active);
      }

      setCategories(filtered);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled, parentId, activeOnly]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

// Hook for full category tree
export function useCategoryTree() {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const buildTree = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { categories: allCategories } = await getCategories();

      // Build tree structure
      const categoryMap = new Map<string, Category & { children: Category[] }>();
      const rootCategories: Category[] = [];

      // First pass: create map with children arrays
      for (const cat of allCategories || []) {
        categoryMap.set(cat.id, { ...cat, children: [] });
      }

      // Second pass: build tree
      for (const cat of allCategories || []) {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      }

      setTree(rootCategories as any);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching category tree:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buildTree();
  }, [buildTree]);

  return { tree, loading, error, refetch: buildTree };
}

// Mutations for categories
export function useCategoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ParsedError | null>(null);

  const createCategory = useCallback(
    async (data: { name: string; slug?: string; parent_id?: string; description?: string; image_url?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const slug =
          data.slug ||
          data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        await upsertCategory({ ...data, slug });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create category";
        const parsedError: ParsedError = {
          message,
          code: (err as any)?.code || "UNKNOWN",
        };
        setError(parsedError);
        return { error: parsedError };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>) => {
      setLoading(true);
      setError(null);

      try {
        await upsertCategory(data, id);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update category";
        const parsedError: ParsedError = {
          message,
          code: (err as any)?.code || "UNKNOWN",
        };
        setError(parsedError);
        return { error: parsedError };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteCategory(id);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete category";
      const parsedError: ParsedError = {
        message,
        code: (err as any)?.code || "UNKNOWN",
      };
      setError(parsedError);
      return { error: parsedError };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
}
