import { createSupabaseServerClient } from "@/lib/supabase-server";
import ProvenanceClient from "./provenance-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stock Provenance | Trovestak Admin",
    description: "Deep traceability for every physical unit.",
};

export default async function ProvenancePage() {
    const supabase = await createSupabaseServerClient();

    const { data: units, error } = await supabase
        .from("inventory_units")
        .select("*, variant:product_variants(name, sku)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching provenance units:", error);
    }

    return (
        <ProvenanceClient initialUnits={units || []} />
    );
}
