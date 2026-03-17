import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DevicesClient from "./devices-client";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "My Devices | Trovestak",
    description: "Manage your registered devices, warranty products, and TroveVoice preferences.",
};

export default async function MyDevicesPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in?returnTo=/account/devices");
    }

    const { data: devices, error } = await supabase
        .from("user_device")
        .select(`
            *,
            products (
                name,
                thumbnail_url,
                content_specifications,
                brand_type,
                product_mesh_node (
                    compute_class,
                    is_master
                )
            ),
            product_variants (
                name,
                sku
            )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

    if (error) {
        console.error("Error fetching devices:", error);
    }

    return (
        <DevicesClient initialDevices={devices || []} />
    );
}
