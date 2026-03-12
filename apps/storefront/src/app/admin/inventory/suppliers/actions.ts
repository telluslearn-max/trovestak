"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

/**
 * Deletes a single supplier and all its associated records (offers, orders).
 * Uses the Admin client to bypass client-side RLS restrictions.
 */
export async function deleteSupplierAction(supplierId: string) {
    try {
        await ensureAdmin("manager");
        const admin = createSupabaseAdminClient();

        console.log(`[Admin Delete] Starting purge for supplier: ${supplierId}`);

        // 1. Delete dependent records first (to be safe, although cascade should handle it)
        const { error: offerErr } = await admin
            .from("supplier_product_offer")
            .delete()
            .eq("supplier_id", supplierId);

        if (offerErr) console.warn("Offer cleanup warning:", offerErr.message);

        const { error: orderErr } = await admin
            .from("procurement_orders")
            .delete()
            .eq("supplier_id", supplierId);

        if (orderErr) console.warn("Orders cleanup warning:", orderErr.message);

        // 2. Final supplier deletion (bypassing RLS)
        const { error } = await admin
            .from("supplier")
            .delete()
            .eq("id", supplierId);

        if (error) throw error;

        await logAdminActivity({
            action: "DELETE_SUPPLIER",
            resource: "supplier",
            resourceId: supplierId,
            metadata: { method: "admin_bypass_rls" },
        });

        revalidatePath("/admin/inventory/suppliers");
        return { success: true };
    } catch (err: any) {
        console.error("Delete Action Failed:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Bulk purges ALL suppliers and their dependencies.
 * Uses the Admin client for direct database manipulation.
 */
export async function purgeSuppliersAction() {
    try {
        await ensureAdmin("super_admin");
        const admin = createSupabaseAdminClient();

        console.log("[Admin Delete] Executing FULL DIRECTORY PURGE");

        // Use neq null to target all rows (since empty delete() often requires a filter)
        await admin.from("supplier_product_offer").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await admin.from("procurement_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        const { error } = await admin
            .from("supplier")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) throw error;

        await logAdminActivity({
            action: "PURGE_SUPPLIER_DIRECTORY",
            resource: "supplier",
            resourceId: "all",
            metadata: { method: "admin_bypass_rls" },
        });

        revalidatePath("/admin/inventory/suppliers");
        return { success: true };
    } catch (err: any) {
        console.error("Purge Action Failed:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Creates a new supplier.
 */
export async function createSupplierAction(formData: any) {
    try {
        await ensureAdmin("editor");
        const admin = createSupabaseAdminClient();

        // Simple slug generation if not provided
        const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const { data, error } = await admin
            .from("supplier")
            .insert([{
                ...formData,
                slug,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        await logAdminActivity({
            action: "CREATE_SUPPLIER",
            resource: "supplier",
            resourceId: data.id,
            metadata: { name: formData.name },
        });

        revalidatePath("/admin/inventory/suppliers");
        return { success: true, data };
    } catch (err: any) {
        console.error("Create Supplier Failed:", err);
        return { success: false, error: err.message };
    }
}
