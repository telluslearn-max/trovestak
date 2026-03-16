"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

// ─── Discount Codes ────────────────────────────────────────────────

export interface DiscountCode {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    description: string | null;
    is_active: boolean;
    usage_count: number;
    usage_limit: number | null;
    minimum_order_amount: number;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

export interface FlashSale {
    id: string;
    title: string;
    description: string | null;
    discount_percent: number;
    product_ids: string[];
    category_slugs: string[];
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    banner_color: string;
    created_at: string;
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as DiscountCode[];
}

export async function createDiscountCodeAction(input: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    description?: string;
    usage_limit?: number;
    minimum_order_amount?: number;
    ends_at?: string;
}) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("discount_codes").insert({
        code: input.code.toUpperCase().trim(),
        type: input.type,
        value: input.value,
        description: input.description || null,
        usage_limit: input.usage_limit || null,
        minimum_order_amount: input.minimum_order_amount || 0,
        ends_at: input.ends_at || null,
        is_active: true,
    });
    if (error) throw new Error(error.message);
    await logAdminActivity({ action: "CREATE_DISCOUNT", resource: "discount_codes", resourceId: input.code, metadata: { code: input.code } });
    revalidatePath("/admin/marketing/promotions");
}

export async function toggleDiscountCodeAction(id: string, is_active: boolean) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("discount_codes").update({ is_active }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/marketing/promotions");
}

export async function deleteDiscountCodeAction(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/marketing/promotions");
}

// ─── Flash Sales ───────────────────────────────────────────────────

export async function getFlashSales(): Promise<FlashSale[]> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("flash_sales")
        .select("*")
        .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as FlashSale[];
}

export async function createFlashSaleAction(input: {
    title: string;
    description?: string;
    discount_percent: number;
    starts_at: string;
    ends_at: string;
    banner_color?: string;
}) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("flash_sales").insert({
        title: input.title,
        description: input.description || null,
        discount_percent: input.discount_percent,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        banner_color: input.banner_color || "#ff3b30",
        is_active: true,
    });
    if (error) throw new Error(error.message);
    await logAdminActivity({ action: "CREATE_DISCOUNT", resource: "flash_sales", resourceId: input.title, metadata: { title: input.title } });
    revalidatePath("/admin/marketing/flash-sales");
}

export async function toggleFlashSaleAction(id: string, is_active: boolean) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("flash_sales").update({ is_active }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/marketing/flash-sales");
}
