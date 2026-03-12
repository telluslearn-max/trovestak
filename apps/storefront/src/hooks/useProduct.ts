"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*, metadata")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Fetch error:", fetchError.message);
        setError(fetchError.message);
        return;
      }

      const productWithParsedData = {
        ...data,
        brand: data.metadata?.brand || data.brand,
        tags: data.metadata?.tags || data.tags,
      };

      setProduct(productWithParsedData);
    } catch (err) {
      console.error("Catch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
