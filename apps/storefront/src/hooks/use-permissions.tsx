"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type RoleName = "super_admin" | "manager" | "editor" | "support" | "customer";

export interface Role {
  id: string;
  name: RoleName;
  display_name: string;
  permissions: Record<string, string[]>;
}

interface PermissionsContextValue {
  role: Role | null;
  roleName: RoleName;
  isLoading: boolean;
  can: (resource: string, action: string) => boolean;
  canAny: (checks: Array<{ resource: string; action: string }>) => boolean;
  hasRole: (roleName: RoleName) => boolean;
  isSuperAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  isSupport: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  role: null,
  roleName: "customer",
  isLoading: true,
  can: () => false,
  canAny: () => false,
  hasRole: () => false,
  isSuperAdmin: false,
  isManager: false,
  isEditor: false,
  isSupport: false,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRole(null);
          setIsLoading(false);
          return;
        }

        const { data: assignment } = await supabase
          .from("user_role_assignments")
          .select("role:user_roles(*)")
          .eq("user_id", user.id)
          .single();

        if (assignment?.role) {
          setRole(assignment.role as unknown as Role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const roleName: RoleName = role?.name || "customer";

  const can = (resource: string, action: string): boolean => {
    if (!role) return false;
    const permissions = role.permissions[resource];
    return permissions?.includes(action) || false;
  };

  const canAny = (checks: Array<{ resource: string; action: string }>): boolean => {
    return checks.some(({ resource, action }) => can(resource, action));
  };

  const hasRole = (checkRole: RoleName): boolean => {
    return roleName === checkRole;
  };

  const value: PermissionsContextValue = {
    role,
    roleName,
    isLoading,
    can,
    canAny,
    hasRole,
    isSuperAdmin: roleName === "super_admin",
    isManager: roleName === "manager",
    isEditor: roleName === "editor",
    isSupport: roleName === "support",
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

export function PermissionGate({
  children,
  resource,
  action,
  fallback = null,
  requireAll = false,
}: {
  children: ReactNode;
  resource: string | string[];
  action: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}) {
  const { can } = usePermissions();

  const resources = Array.isArray(resource) ? resource : [resource];
  const actions = Array.isArray(action) ? action : [action];

  const checks = resources.flatMap((r) => actions.map((a) => ({ resource: r, action: a })));

  const hasPermission = requireAll
    ? checks.every(({ resource: r, action: a }) => can(r, a))
    : checks.some(({ resource: r, action: a }) => can(r, a));

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function RoleGate({
  children,
  roles,
  fallback = null,
}: {
  children: ReactNode;
  roles: RoleName | RoleName[];
  fallback?: ReactNode;
}) {
  const { hasRole } = usePermissions();

  const roleList = Array.isArray(roles) ? roles : [roles];
  const hasRequiredRole = roleList.some((role) => hasRole(role));

  if (hasRequiredRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
