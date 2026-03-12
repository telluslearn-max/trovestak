"use client";

import { Package, PanelLeftClose, PanelLeft, Loader2 } from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin-nav";
import { SidebarProvider, useSidebar } from "./sidebar-provider";
import { SidebarSection } from "./sidebar-section";
import { SidebarFooter } from "./sidebar-footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  role?: string;
}

function SidebarContent({ user, role }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 border-b border-zinc-800 px-4",
        collapsed ? "justify-center py-4" : "py-5"
      )}>
        <div className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold",
          collapsed ? "h-8 w-8 text-sm" : "h-8 w-8 text-sm"
        )}>
          <Package className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-zinc-50 leading-none">Trovestak</div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Admin</div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-center p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <SidebarSection key={section.section || "overview"} section={section} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter user={user} role={role} collapsed={collapsed} />
    </div>
  );
}

export function AdminSidebar(props: SidebarProps) {
  return (
    <SidebarProvider>
      <SidebarContent {...props} />
    </SidebarProvider>
  );
}
