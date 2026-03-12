"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface AdminBadges {
  pendingOrders: number;
  lowStockAlerts: number;
  returns: number;
  supportTickets: number;
  loading: boolean;
}

export function useAdminBadges(): AdminBadges {
  const [badges, setBadges] = useState<AdminBadges>({
    pendingOrders: 0,
    lowStockAlerts: 0,
    returns: 0,
    supportTickets: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchBadges() {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const [pendingOrders, lowStockAlerts] = await Promise.all([
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .lte("stock_quantity", 5)
            .eq("is_active", true),
        ]);

        setBadges({
          pendingOrders: pendingOrders.count ?? 0,
          lowStockAlerts: lowStockAlerts.count ?? 0,
          returns: 0,
          supportTickets: 0,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching admin badges:", error);
        setBadges((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchBadges();
  }, []);

  return badges;
}
