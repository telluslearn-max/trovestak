"use client";

import { Package } from "lucide-react";
import { useProductStats } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCards({ className }: { className?: string }) {
  const { stats, loading } = useProductStats();

  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      <div className="bg-white rounded-lg border border-[#E5E5E7] p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">
              Total Products
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-semibold text-[#1D1D1F]">
                {stats.total.toLocaleString()}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0071E315" }}>
            <Package className="w-5 h-5" style={{ color: "#0071E3" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
