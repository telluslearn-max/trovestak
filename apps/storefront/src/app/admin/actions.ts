"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { ensureAdmin } from "@/lib/admin/guard";
import { revalidatePath } from "next/cache";

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

function catalogHeaders() {
    return { 'Content-Type': 'application/json', 'x-service-token': SERVICE_SECRET };
}

async function callCatalog(path: string, options: RequestInit = {}) {
    const res = await fetch(`${CATALOG_SERVICE_URL}${path}`, {
        ...options,
        headers: { ...catalogHeaders(), ...(options.headers as object || {}) },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

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
    return callCatalog('/brands/with-counts');
}

export async function upsertBrand(formData: Record<string, unknown>, id?: string) {
    if (id) {
        await callCatalog(`/brands/${id}`, { method: 'PATCH', body: JSON.stringify(formData) });
    } else {
        await callCatalog('/brands', { method: 'POST', body: JSON.stringify(formData) });
    }
}

export async function deleteBrand(id: string) {
    await callCatalog(`/brands/${id}`, { method: 'DELETE' });
}

export async function getBrandDetail(slug: string) {
    return callCatalog(`/brands/detail/${encodeURIComponent(slug)}`);
}

export async function updateProductBrand(productId: string, brandSlug: string) {
    await callCatalog(`/products/${productId}/brand`, { method: 'PATCH', body: JSON.stringify({ brandSlug }) });
}

export async function bulkUpdateProductBrand(productIds: string[], brandSlug: string) {
    await callCatalog('/products/bulk/brand', { method: 'POST', body: JSON.stringify({ productIds, brandSlug }) });
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
    return callCatalog('/categories');
}

export async function upsertCategory(formData: Record<string, unknown>, id?: string) {
    await ensureAdmin("editor");
    if (id) {
        await callCatalog(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(formData) });
    } else {
        await callCatalog('/categories', { method: 'POST', body: JSON.stringify(formData) });
    }
    revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
    await ensureAdmin("manager");
    await callCatalog(`/categories/${id}`, { method: 'DELETE' });
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
    return callCatalog(`/categories/${categoryId}/detail`);
}




/**
 * ACTION ITEMS — for the dashboard order bell
 * Returns counts of things that need immediate attention
 */
export async function getActionItems() {
    const supabase = createSupabaseAdminClient();

    const [dispatchRes, criticalStockRes, tradeInsRes, countyRes] = await Promise.all([
        // Paid orders waiting for dispatch
        supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("payment_status", "paid")
            .in("status", ["processing", "packing"]),
        // Critical stock (below 3 units)
        supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .lte("stock_quantity", 3)
            .eq("status", "published"),
        // Pending trade-ins
        supabase
            .from("trade_ins")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
        // Top counties from orders
        supabase
            .from("orders")
            .select("shipping_address, total_amount")
            .eq("payment_status", "paid")
            .limit(500),
    ]);

    // Aggregate county data
    const countyMap: Record<string, { orders: number; revenue: number }> = {};
    for (const row of (countyRes.data || [])) {
        const addr = row.shipping_address as Record<string, string> | null;
        const county = addr?.county?.trim() || addr?.city?.trim() || "Unknown";
        if (!countyMap[county]) countyMap[county] = { orders: 0, revenue: 0 };
        countyMap[county].orders += 1;
        countyMap[county].revenue += row.total_amount || 0;
    }
    const topCounties = Object.entries(countyMap)
        .map(([county, v]) => ({ county, ...v }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

    return {
        dispatchQueue: dispatchRes.count || 0,
        criticalStock: criticalStockRes.count || 0,
        tradeInsPending: tradeInsRes.count || 0,
        topCounties,
    };
}

export async function getBrands() {
    await ensureAdmin("support");
    return callCatalog('/brands');
}
