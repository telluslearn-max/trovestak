"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV_SECTIONS, DEFAULT_COLLAPSED_SECTIONS, NavItem } from "@/lib/admin-nav";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { T } from "./ui-pro";
import { useTheme } from "./theme-wrapper";

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onClick: () => void;
}

function SidebarItem({ item, collapsed, pathname, onClick }: SidebarItemProps) {
  const isActive = pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(item.href));

  return (
    <button
      onClick={onClick}
      className={cn(
        "nav-btn w-full flex items-center gap-2 px-3 py-1.5 min-h-[32px] transition-all relative group",
        isActive ? "active" : "text-zinc-400"
      )}
      style={{
        background: isActive ? T.card : "transparent",
        color: isActive ? T.text : "#94a3b8",
        border: "none",
        cursor: "pointer",
        padding: collapsed ? "10px" : "6px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        fontFamily: "'Syne', sans-serif"
      }}
      title={collapsed ? item.label : undefined}
    >
      {isActive && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 2, height: 16, background: T.blue, borderRadius: "0 2px 2px 0",
        }} />
      )}

      <span style={{ fontSize: 13, flexShrink: 0, position: "relative", zIndex: 1 }}>{item.icon}</span>
      {!collapsed && (
        <span style={{
          fontSize: 11, fontWeight: isActive ? 700 : 400,
          flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          position: "relative", zIndex: 1
        }}>
          {item.label}
        </span>
      )}

      {!collapsed && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 700,
          background: isActive ? "#1d4ed820" : T.card,
          color: isActive ? T.blue : "#64748b",
          borderRadius: 7, padding: "1px 6px",
          fontFamily: "var(--font-jetbrains), monospace",
          position: "relative", zIndex: 1
        }}>
          {item.badge}
        </span>
      )}
      {collapsed && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
        <span style={{
          position: "absolute", top: 6, right: 6,
          width: 5, height: 5, borderRadius: "50%",
          background: T.blue,
        }} />
      )}
    </button>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  collapsedSections: Record<string, boolean>;
  setCollapsedSections: (sections: Record<string, boolean>) => void;
  pathname: string;
  activeItem: string;
  setActiveItem: (item: string) => void;
  handleLogout: () => void;
  user: { email?: string; user_metadata?: { full_name?: string } };
  role?: string;
  loading: boolean;
}

function SidebarContent({
  collapsed,
  setCollapsed,
  collapsedSections,
  setCollapsedSections,
  pathname,
  activeItem,
  setActiveItem,
  handleLogout,
  user,
  role,
  loading
}: SidebarContentProps) {
  const initials = (user.user_metadata?.full_name ?? user.email ?? "??")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const displayName = user.user_metadata?.full_name ?? user.email ?? "Admin";

  const toggleSection = (section: string) => {
    setCollapsedSections({
      ...collapsedSections,
      [section]: !collapsedSections[section],
    });
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        width: collapsed ? 56 : 220,
        minWidth: collapsed ? 56 : 220,
        transition: "width .2s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden"
      }}
    >
      {/* Logo */}
      <div style={{
        height: 54,
        display: "flex",
        alignItems: "center",
        padding: collapsed ? "0" : "0 16px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0
        }}>B</div>
        {!collapsed && (
          <>
            <div style={{ marginLeft: 10, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "-.01em" }}>Trovestak</div>
              <div style={{ fontSize: 8, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace", letterSpacing: ".12em" }}>ADMIN</div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14, padding: "3px", borderRadius: 4, flexShrink: 0 }}
            >
              ‹
            </button>
          </>
        )}
      </div>

      {!collapsed && (
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0", scrollbarWidth: "none" }}>
          {ADMIN_NAV_SECTIONS.map(({ section, items }) => (
            <div key={section || "top"}>
              {section && (
                <button
                  onClick={() => toggleSection(section)}
                  style={{
                    width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 16px 2px", color: T.textMuted, fontSize: 8, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: "var(--font-jetbrains), monospace"
                  }}
                >
                  {section}
                  <span style={{ transform: collapsedSections[section] ? "rotate(-90deg)" : "none", transition: "transform .15s", fontSize: 8 }}>▾</span>
                </button>
              )}
              {(!section || !collapsedSections[section]) && items.map((item) => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <SidebarItem item={item} collapsed={collapsed} pathname={pathname} onClick={() => { }} />
                </Link>
              ))}
              {!section && <div style={{ height: 1, background: T.border, margin: "6px 0" }} />}
            </div>
          ))}
        </nav>
      )}

      {collapsed && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 8 }}>
          <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: "10px", fontSize: 14 }}>
            ›
          </button>
          {ADMIN_NAV_SECTIONS.flatMap(s => s.items).map(item => (
            <Link key={item.href} href={item.href}>
              <SidebarItem item={item} collapsed={true} pathname={pathname} onClick={() => { }} />
            </Link>
          ))}
        </div>
      )}

      {/* User */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: collapsed ? "10px 8px" : "10px 14px", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0
        }}>
          {initials[0]}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
              <div style={{ fontSize: 9, color: T.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{role || "Staff"}</div>
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 12, padding: 3, borderRadius: 4 }}>
              ⏻
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface AdminSidebarClientProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  userRole: string;
  userRoleDisplay: string;
  initials: string;
  displayName: string;
  children: React.ReactNode;
}

export function AdminSidebarClient({
  user,
  userRole,
  userRoleDisplay,
  initials,
  displayName,
  children,
}: AdminSidebarClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_COLLAPSED_SECTIONS.map((s) => [s, true]))
  );
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

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

  const getPageTitle = () => {
    const path = pathname === "/admin" ? "Dashboard" : pathname.split("/").pop() || "Admin";
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
  };

  return (
    <div className="flex h-screen overflow-hidden admin-theme" style={{ background: T.bg }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-200 outline-none",
        )}
        style={{ width: collapsed ? 56 : 220, background: T.surface, borderRight: `1px solid ${T.border}` }}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          collapsedSections={collapsedSections}
          setCollapsedSections={setCollapsedSections}
          pathname={pathname}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
          handleLogout={handleLogout}
          user={user}
          role={userRoleDisplay}
          loading={loading}
        />
      </aside>

      {/* Mobile Topbar */}
      <div className="lg:hidden w-full flex flex-col admin-theme">
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 54,
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", padding: "0 16px", gap: 12, zIndex: 30,
        }}>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" style={{ color: T.textSub }}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56 border-none" style={{ background: T.surface }}>
              <SidebarContent
                collapsed={false}
                setCollapsed={() => { }}
                collapsedSections={collapsedSections}
                setCollapsedSections={setCollapsedSections}
                pathname={pathname}
                activeItem={activeItem}
                setActiveItem={setActiveItem}
                handleLogout={handleLogout}
                user={user}
                role={userRoleDisplay}
                loading={loading}
              />
            </SheetContent>
          </Sheet>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>T</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Trovestak Admin</span>
        </header>
        <main style={{ paddingTop: 54, flex: 1, overflowY: "auto" }}>
          <div style={{ padding: 20 }}>{children}</div>
        </main>
      </div>

      {/* Desktop Main Content */}
      <div
        className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-200"
        style={{ marginLeft: collapsed ? 56 : 220 }}
      >
        {/* Top Bar */}
        <header style={{
          height: 54, background: T.surface, borderBottom: `1px solid ${T.border}`,
          padding: "0 24px", display: "flex", alignItems: "center", gap: 12,
          position: "sticky", top: 0, zIndex: 20, flexShrink: 0
        }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color: T.textMuted }}>Trovestak</span>
            <span style={{ color: T.border }}>›</span>
            <span style={{ fontWeight: 700, color: T.textSub }}>{getPageTitle()}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, background: T.card,
              border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", width: 220, cursor: "text"
            }}>
              <span style={{ color: T.textMuted, fontSize: 12 }}>⌕</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>Search anything...</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: T.border, background: T.border, borderRadius: 3, padding: "1px 5px", fontFamily: "monospace" }}>⌘K</span>
            </div>

            <button
              onClick={toggleTheme}
              style={{
                width: 32, height: 32, borderRadius: 8, background: T.card,
                border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: T.textSub, fontSize: 13,
                transition: "all 0.2s"
              }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>

            <button style={{
              width: 32, height: 32, borderRadius: 8, background: T.card,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.textSub, fontSize: 13, position: "relative"
            }}>
              🔔
              <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: T.red, border: `2px solid var(--admin-topbar)` }} />
            </button>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", cursor: "pointer" }}>
              {initials[0]}
            </div>
          </div>
        </header>


        {/* Page Content */}
        <main style={{ flex: 1, overflowY: "auto", background: T.bg }}>
          <div className="page-enter" style={{ padding: 32 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
