"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ensureAdmin } from "@/lib/admin/guard";

export interface RevenueDay {
    date: string;
    total: number;
    count: number;
}

export interface ReconciliationOrder {
    id: string;
    customer_name: string | null;
    customer_phone: string | null;
    total_amount: number;
    payment_method: string | null;
    payment_status: string;
    mpesa_receipt_number: string | null;
    created_at: string;
    status: string;
}

export interface FinanceSummary {
    grossRevenue: number;
    mpesaRevenue: number;
    manualRevenue: number;
    codRevenue: number;
    paidOrderCount: number;
    unpaidOrderCount: number;
    avgOrderValue: number;
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select("total_amount, payment_method, payment_status");

    if (error) throw new Error(error.message);

    const rows = data || [];
    const paid = rows.filter(r => r.payment_status === "paid");
    const gross = paid.reduce((s, r) => s + (r.total_amount || 0), 0);
    const mpesa = paid.filter(r => r.payment_method === "mpesa").reduce((s, r) => s + (r.total_amount || 0), 0);
    const manual = paid.filter(r => r.payment_method === "manual_till").reduce((s, r) => s + (r.total_amount || 0), 0);
    const cod = paid.filter(r => r.payment_method === "cod" || r.payment_method === "cash_on_delivery").reduce((s, r) => s + (r.total_amount || 0), 0);

    return {
        grossRevenue: gross,
        mpesaRevenue: mpesa,
        manualRevenue: manual,
        codRevenue: cod,
        paidOrderCount: paid.length,
        unpaidOrderCount: rows.filter(r => r.payment_status !== "paid").length,
        avgOrderValue: paid.length > 0 ? Math.round(gross / paid.length) : 0,
    };
}

export async function getRevenueByDay(days: number = 30): Promise<RevenueDay[]> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("payment_status", "paid")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const byDay: Record<string, { total: number; count: number }> = {};
    for (const row of (data || [])) {
        const day = row.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { total: 0, count: 0 };
        byDay[day].total += row.total_amount || 0;
        byDay[day].count += 1;
    }

    return Object.entries(byDay)
        .map(([date, v]) => ({ date, total: v.total, count: v.count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMpesaReconciliation(
    opts: { from?: string; to?: string; unmatched?: boolean } = {}
): Promise<ReconciliationOrder[]> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    let q = supabase
        .from("orders")
        .select("id, customer_name, customer_phone, total_amount, payment_method, payment_status, mpesa_receipt_number, created_at, status")
        .eq("payment_method", "mpesa")
        .order("created_at", { ascending: false })
        .limit(200);

    if (opts.from) q = q.gte("created_at", opts.from);
    if (opts.to) q = q.lte("created_at", opts.to);
    if (opts.unmatched) q = q.is("mpesa_receipt_number", null);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []) as ReconciliationOrder[];
}

export async function updateMpesaReceiptAction(orderId: string, receiptNumber: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("orders")
        .update({
            mpesa_receipt_number: receiptNumber.toUpperCase(),
            payment_status: "paid",
        })
        .eq("id", orderId);

    if (error) throw new Error(error.message);
}
