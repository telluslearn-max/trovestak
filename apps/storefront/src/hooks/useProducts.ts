"use client";

import { useState, useEffect, useCallback } from "react";
import { getProductsAdmin } from "@/app/admin/products/actions";
import { Product } from "@/types/product";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function useProducts(page: number = 1, limit: number = 100) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductsAdmin({ page, limit });

      setProducts(result.products || []);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      });
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch, pagination };
}

export function useProductStats() {
  const [stats, setStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getProductsAdmin({ page: 1, limit: 1 });
        setStats({ total: result.total || 0 });
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading };
}
