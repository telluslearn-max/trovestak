import { createSupabaseServerClient } from "@/lib/supabase-server";
import WarehousesClient from "./warehouses-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Storage Nodes | Trovestak Admin",
    description: "Manage physical warehouses, distribution hubs, and retail outlets.",
};

export default async function WarehousesPage() {
    const supabase = await createSupabaseServerClient();

    const { data: warehouses, error } = await supabase
        .from("warehouse_locations")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching warehouses:", error);
    }

    return (
        <WarehousesClient initialWarehouses={warehouses || []} />
    );
}
