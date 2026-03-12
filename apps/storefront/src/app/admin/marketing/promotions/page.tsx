import { createSupabaseServerClient } from "@/lib/supabase-server";
import PromotionsClient from "./promotions-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Promotions & Coupons | Trovestak Admin",
    description: "Manage customer discounts and promo codes.",
};

export default async function AdminPromotionsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: promotions, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching promotions:", error);
    }

    return (
        <PromotionsClient initialPromotions={promotions || []} />
    );
}
