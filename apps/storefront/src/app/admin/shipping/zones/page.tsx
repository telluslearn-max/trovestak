import { Metadata } from "next";
import ShippingZonesClient from "./zones-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
    title: "Shipping Zones | Trovestak Admin",
    description: "Manage Kenya delivery zones and rates.",
};

export interface ShippingZone {
    id: string;
    name: string;
    counties: string[];
    carrier: string | null;
    estimated_days: string | null;
    is_active: boolean;
    rate_amount: number;
}

export default async function ShippingZonesPage() {
    const supabase = await createSupabaseServerClient();

    const { data: zones, error } = await supabase
        .from("shipping_zones")
        .select(`
            id, name, counties, carrier, estimated_days, is_active,
            shipping_rates ( rate_amount )
        `)
        .order("name");

    if (error) console.error("Error fetching shipping zones:", error);

    const rows = ((zones || []) as any[]).map(z => ({
        id: z.id,
        name: z.name,
        counties: z.counties || [],
        carrier: z.carrier,
        estimated_days: z.estimated_days,
        is_active: z.is_active,
        rate_amount: z.shipping_rates?.[0]?.rate_amount || 0,
    })) as ShippingZone[];

    return <ShippingZonesClient initialZones={rows} />;
}
