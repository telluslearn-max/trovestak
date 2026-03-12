import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AdminAction =
    | "CREATE_PRODUCT"
    | "UPDATE_PRODUCT"
    | "DELETE_PRODUCT"
    | "UPDATE_ORDER_STATUS"
    | "UPDATE_ORDER_TRACKING"
    | "UPDATE_ORDER_NOTES"
    | "CREATE_DISCOUNT"
    | "UPDATE_DISCOUNT"
    | "DELETE_DISCOUNT"
    | "UPDATE_USER_ROLE"
    | "INVITE_USER"
    | "UPDATE_MENU"
    | "UPDATE_PAGE"
    | "BULK_ACTION";

export async function logAdminActivity(params: {
    action: AdminAction | string;
    resource: string;
    resourceId: string;
    metadata?: any;
}) {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("admin_activity_log").insert({
        actor_id: user.id,
        action: params.action,
        resource: params.resource,
        resource_id: params.resourceId,
        metadata: params.metadata,
    });

    if (error) {
        console.error("Failed to log admin activity:", error);
    }
}
