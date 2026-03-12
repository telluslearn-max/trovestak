"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEFAULT_COLLAPSED_SECTIONS } from "@/lib/admin-nav";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  collapsedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return Object.fromEntries(DEFAULT_COLLAPSED_SECTIONS.map((s) => [s, true]));
    }
    const stored = localStorage.getItem("admin-sidebar-sections");
    if (stored) {
      return JSON.parse(stored);
    }
    return Object.fromEntries(DEFAULT_COLLAPSED_SECTIONS.map((s) => [s, true]));
  });

  useEffect(() => {
    localStorage.setItem("admin-sidebar-sections", JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, collapsedSections, toggleSection }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
