"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/admin-nav";
import { Badge } from "@/components/ui/badge";

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
}

export function SidebarItem({ item, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || 
    (item.href !== "/admin" && pathname.startsWith(item.href));

  const Icon: any = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 group relative",
        isActive
          ? "bg-zinc-800 text-zinc-50"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r"
        />
      )}
      
      <span
        className={cn(
          "flex items-center gap-2.5",
          collapsed && "justify-center w-full"
        )}
      >
        {typeof Icon === "string" ? (
          <span className={cn(
            "flex h-4 w-4 items-center justify-center text-base flex-shrink-0",
            isActive ? "text-zinc-50" : "text-zinc-500 group-hover:text-zinc-300"
          )}>
            {Icon}
          </span>
        ) : (
          <Icon 
            className={cn(
              "h-4 w-4 flex-shrink-0", 
              isActive ? "text-zinc-50" : "text-zinc-500 group-hover:text-zinc-300"
            )} 
          />
        )}
        {!collapsed && <span>{item.label}</span>}
      </span>

      {!collapsed && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            "h-5 min-w-5 px-1.5 text-[10px] font-bold",
            isActive ? "bg-white/20 text-white" : "bg-zinc-700 text-zinc-300"
          )}
        >
          {item.badge}
        </Badge>
      )}

      {!collapsed && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
        <span
          className={cn(
            "absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500",
            collapsed && "hidden"
          )}
        />
      )}
    </Link>
  );
}
