"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarItem } from "./sidebar-item";
import { cn } from "@/lib/utils";
import { NavSection } from "@/lib/admin-nav";
import { useSidebar } from "./sidebar-provider";

interface SidebarSectionProps {
  section: NavSection;
}

export function SidebarSection({ section }: SidebarSectionProps) {
  const { collapsedSections, toggleSection, collapsed } = useSidebar();
  const isCollapsed = collapsedSections[section.section || ""];
  const Icon = isCollapsed ? ChevronRight : ChevronDown;

  if (!section.section) {
    return (
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarItem key={item.href} item={item} collapsed={collapsed} />
        ))}
        <div className="h-px bg-zinc-800 my-2" />
      </div>
    );
  }

  return (
    <Collapsible
      open={!isCollapsed && !collapsed}
      onOpenChange={() => toggleSection(section.section || "")}
      className="w-full"
    >
      <CollapsibleTrigger
        className={cn(
          "flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors",
          collapsed && "justify-center px-2"
        )}
      >
        {!collapsed && (
          <>
            <span>{section.section}</span>
            <Icon className="h-3 w-3 transition-transform" />
          </>
        )}
        {collapsed && <span>{section.section.charAt(0)}</span>}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-0.5">
        {!collapsed &&
          section.items.map((item) => (
            <SidebarItem key={item.href} item={item} collapsed={collapsed} />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
