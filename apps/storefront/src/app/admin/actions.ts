"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";
import { revalidatePath } from "next/cache";

/**
 * ADMIN DASHBOARD SERVER ACTIONS
 * 
 * Fetches data for the main admin dashboard.
 * These run on the server, ensuring Supabase credentials stay protected.
 */

export async function getDashboardStats() {
    // Use service role to bypass RLS that internally references auth.users
    const supabase = createSupabaseAdminClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [revRes, ordRes, lowRes] = await Promise.all([
        supabase
            .from("orders")
            .select("total_amount")
            .gte("created_at", todayStr)
            .eq("status", "completed"),
        supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .gte("created_at", todayStr),
        supabase
            .from("product_variants")
            .select("id", { count: "exact", head: true })
            .lt("stock_quantity", 10)
    ]);

    if (revRes.error) throw new Error(revRes.error.message);
    if (ordRes.error) throw new Error(ordRes.error.message);
    if (lowRes.error) throw new Error(lowRes.error.message);

    const revenueToday = revRes.data.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;
    const ordersToday = ordRes.count || 0;

    return {
        revenueToday,
        ordersToday,
        avgOrderValue: ordersToday > 0 ? revenueToday / ordersToday : 0,
        lowStockCount: lowRes.count || 0
    };
}

export async function getRevenueTrend() {
    const supabase = createSupabaseAdminClient();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data, error } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .gte("created_at", fourteenDaysAgo.toISOString())
        .eq("status", "completed");

    if (error) throw new Error(error.message);

    const revByDay: Record<string, number> = {};
    data.forEach((o: any) => {
        const d = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        revByDay[d] = (revByDay[d] || 0) + (o.total_amount || 0);
    });

    return Object.entries(revByDay).map(([d, rev]) => ({ d, rev: rev / 100 }));
}

export async function getRecentOrders() {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
        .from("orders")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(6);

    if (error) throw new Error(error.message);
    return data;
}

export async function getTopProducts() {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
        .from("product_variants")
        .select("*, product:products(name)")
        .order("stock_quantity", { ascending: false })
        .limit(5);

    if (error) throw new Error(error.message);
    return data;
}

export async function getLowStockItems() {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
        .from("product_variants")
        .select("*, product:products(name)")
        .lt("stock_quantity", 10)
        .limit(5);

    if (error) throw new Error(error.message);
    return data.map(i => ({
        ...i,
        progress: Math.max(5, (i.stock_quantity / 20) * 100)
    }));
}

/**
 * BRAND MANAGEMENT ACTIONS
 */

export async function getBrandsWithCounts() {
    const supabase = await createSupabaseServerClient();

    const { data: brands, error: bError } = await supabase
        .from("brands")
        .select("*")
        .order("name");

    if (bError) throw new Error(bError.message);

    const brandsWithCounts = await Promise.all((brands || []).map(async (brand: any) => {
        const { count: pCount } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("brand_type", brand.slug);
        return { ...brand, productCount: pCount || 0 };
    }));

    return brandsWithCounts;
}

export async function upsertBrand(formData: any, id?: string) {
    const supabase = await createSupabaseServerClient();

    if (id) {
        const { error } = await supabase
            .from("brands")
            .update(formData)
            .eq("id", id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from("brands")
            .insert({ ...formData, is_active: true });
        if (error) throw new Error(error.message);
    }
}

export async function deleteBrand(id: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export async function getBrandDetail(slug: string) {
    const supabase = await createSupabaseServerClient();

    let brand;
    if (slug === "uncategorized") {
        brand = {
            id: "uncategorized",
            name: "Uncategorized",
            slug: "uncategorized",
            description: "Products pending brand assignment",
            is_virtual: true
        };
    } else {
        const { data, error } = await supabase
            .from("brands")
            .select("*")
            .eq("slug", slug)
            .single();
        if (error) throw new Error(error.message);
        brand = data;
    }

    // Fetch Products
    let pQuery = supabase.from("products").select("id, name, slug, thumbnail_url, is_active");
    if (slug === "uncategorized") {
        pQuery = pQuery.or('brand_type.is.null,brand_type.eq."",brand_type.eq.generic');
    } else {
        pQuery = pQuery.eq("brand_type", slug);
    }
    const { data: products, error: pError } = await pQuery.order("name");
    if (pError) throw new Error(pError.message);

    // Fetch all brands for dropdowns
    const { data: brandsList, error: bListError } = await supabase
        .from("brands")
        .select("name, slug")
        .order("name");

    return {
        brand,
        products: products || [],
        brandsList: brandsList || []
    };
}

export async function updateProductBrand(productId: string, brandSlug: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("products")
        .update({ brand_type: brandSlug })
        .eq("id", productId);
    if (error) throw new Error(error.message);
}

export async function bulkUpdateProductBrand(productIds: string[], brandSlug: string) {
    const supabase = await createSupabaseServerClient();
    // Using .in filter for bulk update
    const { error } = await supabase
        .from("products")
        .update({ brand_type: brandSlug })
        .in("id", productIds);
    if (error) throw new Error(error.message);
}

/**
 * CUSTOMER MANAGEMENT ACTIONS
 */

export async function getCustomers() {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*, orders(total_amount, status)")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (profiles || []).map((p: any) => {
        const validOrders = p.orders?.filter((o: any) => o.status !== 'cancelled') || [];
        return {
            ...p,
            order_count: validOrders.length,
            total_spent: validOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)
        };
    });
}

/**
 * CATEGORY MANAGEMENT ACTIONS
 */

export async function getCategories() {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();
    const { data, count, error } = await supabase
        .from("categories")
        .select("*", { count: "exact" })
        .order("name");

    if (error) throw new Error(error.message);
    return { categories: data || [], totalCount: count || 0 };
}

export async function upsertCategory(formData: any, id?: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    if (id) {
        const { error } = await supabase
            .from("categories")
            .update(formData)
            .eq("id", id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from("categories")
            .insert({ ...formData, is_active: true });
        if (error) throw new Error(error.message);
    }
    revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/categories");
}

/**
 * ANALYTICS ACTIONS
 */

export async function getAnalyticsSummary() {
    await ensureAdmin("support");
    const supabase = createSupabaseAdminClient();

    // Fetch last 30 days of data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, created_at, user_id")
        .gte("created_at", thirtyDaysAgo);

    if (error) throw new Error(error.message);

    // Process data for charts
    const dailyData: Record<string, any> = {};
    let totalRevenue = 0;
    const uniqueCustomers = new Set();

    (orders || []).forEach(o => {
        const day = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[day]) {
            dailyData[day] = { day, revenue: 0, orders: 0 };
        }
        dailyData[day].revenue += (o.total_amount || 0);
        dailyData[day].orders += 1;
        totalRevenue += (o.total_amount || 0);
        if (o.user_id) uniqueCustomers.add(o.user_id);
    });

    const chartData = Object.values(dailyData).sort((a: any, b: any) =>
        new Date(a.day).getTime() - new Date(b.day).getTime()
    );

    return {
        chartData,
        stats: {
            revenue: totalRevenue,
            orders: orders?.length || 0,
            customers: uniqueCustomers.size,
            avgOrder: orders?.length ? totalRevenue / orders.length : 0
        }
    };
}

/**
 * CATEGORY DETAIL ACTIONS
 */

export async function getCategoryDetail(categoryId: string) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const [subsRes, linksRes] = await Promise.all([
        supabase
            .from("categories")
            .select("*")
            .eq("parent_id", categoryId)
            .order("name"),
        supabase
            .from("product_categories")
            .select("product_id")
            .eq("category_id", categoryId)
    ]);

    if (subsRes.error) throw new Error(subsRes.error.message);
    if (linksRes.error) throw new Error(linksRes.error.message);

    let products: any[] = [];
    if (linksRes.data?.length) {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .in("id", linksRes.data.map((l: any) => l.product_id))
            .order("name");
        if (error) throw new Error(error.message);
        products = data || [];
    }

    return {
        subcategories: subsRes.data || [],
        products
    };
}




export async function getBrands() {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("brands")
        .select("name, slug")
        .eq("is_active", true)
        .order("name");

    if (error) throw new Error(error.message);
    return data || [];
}
