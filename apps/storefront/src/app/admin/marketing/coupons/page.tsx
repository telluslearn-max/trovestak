import { createSupabaseServerClient } from "@/lib/supabase-server";
import CouponsClient from "./coupons-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Promotions & Coupons | Trovestak Admin",
    description: "Manage customer discounts and coupon codes.",
};

export default async function AdminCouponsPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch discounts of type 'coupon', fallback to all if none found (as in legacy logic)
    let { data: coupons, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("type", "coupon")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching coupons:", error);
    }

    if (!coupons || coupons.length === 0) {
        const { data: all } = await supabase
            .from("discounts")
            .select("*")
            .order("created_at", { ascending: false });
        coupons = all || [];
    }

    return (
        <CouponsClient initialCoupons={coupons} />
    );
}
