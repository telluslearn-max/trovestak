import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AdminSidebarClient } from "@/components/admin/sidebar-client";
import { ThemeWrapper } from "@/components/admin/theme-wrapper";
import { Toaster } from "sonner";
import { Syne, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import "./admin-pro.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?returnTo=/admin");

  const { data: roleAssignment } = await supabase
    .from("user_role_assignments")
    .select("role:user_roles(name, display_name)")
    .eq("user_id", user.id)
    .single();

  const userRole = (roleAssignment?.role as any)?.name;
  const userRoleDisplay = (roleAssignment?.role as any)?.display_name ?? "Staff";

  if (!userRole || !["super_admin", "manager", "editor", "support"].includes(userRole)) {
    redirect("/auth/login?returnTo=/admin");
  }

  const initials = (user.user_metadata?.full_name ?? user.email ?? "??")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const displayName = user.user_metadata?.full_name ?? user.email ?? "Admin";

  return (
    <ThemeWrapper>
      <div className={`${syne.variable} ${jetbrains.variable} ${dmSans.variable} admin-theme`}>
        <AdminSidebarClient
          user={user}
          userRole={userRole}
          userRoleDisplay={userRoleDisplay}
          initials={initials}
          displayName={displayName}
        >
          {children}
        </AdminSidebarClient>
        <Toaster richColors position="bottom-right" />
      </div>
    </ThemeWrapper>
  );
}
