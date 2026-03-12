"use client";

import { LogOut, Store, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarFooterProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  role?: string;
  collapsed: boolean;
}

export function SidebarFooter({ user, role, collapsed }: SidebarFooterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const initials = (user.user_metadata?.full_name ?? user.email ?? "??")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const displayName = user.user_metadata?.full_name ?? user.email ?? "Admin";

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "border-t border-zinc-800 p-3 space-y-1",
      collapsed && "p-2"
    )}>
      <Link
        href="/store"
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors",
          collapsed && "justify-center px-2"
        )}
      >
        <Store className="h-4 w-4" />
        {!collapsed && <span>View Storefront</span>}
      </Link>
      
      <button
        onClick={handleLogout}
        disabled={loading}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50",
          collapsed && "justify-center px-2"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {!collapsed && <span>Sign Out</span>}
      </button>

      {!collapsed && (
        <div className="flex items-center gap-3 pt-2 mt-2 border-t border-zinc-800">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate">{displayName}</div>
            <div className="text-xs text-zinc-500 capitalize">{role || "Staff"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
