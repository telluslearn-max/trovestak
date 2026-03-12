import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Verify caller is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: roleAssignment } = await supabase
            .from("user_role_assignments")
            .select("role:user_roles(name)")
            .eq("user_id", user.id)
            .single();

        const roleName = (roleAssignment?.role as any)?.name;
        if (!["super_admin", "manager"].includes(roleName)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const { email, roleId } = await request.json();
        if (!email || !roleId) {
            return NextResponse.json({ error: "Email and roleId are required" }, { status: 400 });
        }

        // Invite via Supabase Admin (this sends the confirmation email)
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { invited_by: user.id, invite_role_id: roleId },
        });

        if (inviteError) {
            return NextResponse.json({ error: inviteError.message }, { status: 400 });
        }

        // Pre-assign role (will be confirmed once user accepts invite)
        if (inviteData?.user?.id) {
            await supabase.from("user_role_assignments").upsert({
                user_id: inviteData.user.id,
                role_id: roleId,
                assigned_by: user.id,
            });

            // Log activity
            await supabase.from("admin_activity_log").insert({
                actor_id: user.id,
                action: "invite_user",
                resource: "users",
                resource_id: inviteData.user.id,
                metadata: { email, roleId },
            });
        }

        return NextResponse.json({ success: true, userId: inviteData?.user?.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
}
