"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAttributeGroups,
  upsertAttributeGroup,
  deleteAttributeGroup,
  upsertAttributeTerm,
  deleteAttributeTerm
} from "@/app/admin/products/actions";
import { interpretPostgresError, type ParsedError } from "@/lib/postgres-errors";
import type { ProductAttributeGroup, ProductAttributeTerm } from "@/types/product";

interface UseAttributeGroupsReturn {
  groups: ProductAttributeGroup[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAttributeGroups(enabled = true): UseAttributeGroupsReturn {
  const [groups, setGroups] = useState<ProductAttributeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAttributeGroups();
      setGroups(data || []);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching attribute groups:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
  };
}

// Hook for fetching terms of a specific group
export function useAttributeTerms(groupId: string, enabled = true) {
  const [terms, setTerms] = useState<ProductAttributeTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTerms = useCallback(async () => {
    if (!enabled || !groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("product_attribute_terms")
        .select("*")
        .eq("group_id", groupId)
        .order("position", { ascending: true })
        .order("name");

      if (fetchError) throw fetchError;

      setTerms(data || []);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching attribute terms:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled, groupId]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  return {
    terms,
    loading,
    error,
    refetch: fetchTerms,
  };
}

// Mutations for attribute groups
export function useAttributeGroupMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ParsedError | null>(null);

  // Create group
  const createGroup = useCallback(
    async (data: { name: string; slug?: string; type?: string; display_type?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const slug =
          data.slug ||
          data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const group = await upsertAttributeGroup({ ...data, slug });
        return { data: group };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create attribute group";
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

  // Update group
  const updateGroup = useCallback(
    async (id: string, data: Partial<ProductAttributeGroup>) => {
      setLoading(true);
      setError(null);

      try {
        const group = await upsertAttributeGroup(data, id);
        return { data: group };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update attribute group";
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

  // Delete group
  const deleteGroup = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteAttributeGroup(id);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete attribute group";
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

  // Create term
  const createTerm = useCallback(
    async (groupId: string, data: { name: string; slug?: string; value?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const slug =
          data.slug ||
          data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const term = await upsertAttributeTerm({ ...data, group_id: groupId, slug });
        return { data: term };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create attribute term";
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

  // Update term
  const updateTerm = useCallback(
    async (id: string, data: Partial<ProductAttributeTerm>) => {
      setLoading(true);
      setError(null);

      try {
        const term = await upsertAttributeTerm(data, id);
        return { data: term };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update attribute term";
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

  // Delete term
  const deleteTerm = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteAttributeTerm(id);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete attribute term";
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
    createGroup,
    updateGroup,
    deleteGroup,
    createTerm,
    updateTerm,
    deleteTerm,
    loading,
    error,
  };
}
