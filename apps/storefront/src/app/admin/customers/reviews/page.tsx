import { createSupabaseServerClient } from "@/lib/supabase-server";
import CustomerReviewsClient from "./reviews-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer Reviews | Trovestak Admin",
    description: "Product sentiment and feedback management.",
};

export default async function AdminCustomerReviewsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: reviews, error } = await supabase
        .from("product_reviews")
        .select("id, rating, content, author_name, product_name, created_at, status")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching customer reviews:", error);
    }

    const rows = reviews || [];
    const avg = rows.length ? rows.reduce((a: number, r: any) => a + (r.rating || 0), 0) / rows.length : 0;
    const positive = rows.filter((r: any) => (r.rating || 0) >= 4).length;

    const stats = {
        avg: Math.round(avg * 10) / 10,
        total: rows.length,
        positivePerc: rows.length ? `${Math.round(positive / rows.length * 100)}%` : "—",
    };

    return (
        <CustomerReviewsClient initialReviews={rows} stats={stats} />
    );
}
