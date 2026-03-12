import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AccountClient from "./account-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Prime Account | Trovestak",
    description: "Command center for your acquisitions, registered equipment, and security mesh.",
};

export default async function AccountPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in?returnTo=/account");
    }

    // Fetch recent orders
    const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

    // Fetch registered devices
    const { data: devicesData } = await supabase
        .from("user_device")
        .select("*, products(name, thumbnail_url)")
        .eq("user_id", user.id)
        .eq("is_active", true);

    return (
        <AccountClient
            user={user}
            orders={ordersData || []}
            devices={devicesData || []}
        />
    );
}
