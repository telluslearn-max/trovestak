import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export type AdminRole = "super_admin" | "manager" | "editor" | "support";

const ROLE_HIERARCHY: Record<AdminRole, number> = {
    super_admin: 4,
    manager: 3,
    editor: 2,
    support: 1,
};

export async function getAdminUser() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: roleAssignment } = await supabase
        .from("user_role_assignments")
        .select("role:user_roles(name)")
        .eq("user_id", user.id)
        .single();

    return {
        ...user,
        role: (roleAssignment?.role as any)?.name as AdminRole,
    };
}

export async function ensureAdmin(minRole: AdminRole = "support") {
    const user = await getAdminUser();

    if (!user || ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
        throw new Error(`Unauthorized: Required role ${minRole}`);
    }

    return user;
}
