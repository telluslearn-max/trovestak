import { createSupabaseServerClient } from "@/lib/supabase-server";
import GiftCardsClient from "./gift-cards-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gift Cards | Trovestak Admin",
    description: "Issue and manage customer gift cards.",
};

export default async function FinanceGiftCardsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: cards, error } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching gift cards:", error);
    }

    return (
        <GiftCardsClient initialCards={cards || []} />
    );
}
