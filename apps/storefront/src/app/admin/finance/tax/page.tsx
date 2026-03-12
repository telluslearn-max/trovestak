import { createSupabaseServerClient } from "@/lib/supabase-server";
import TaxClient from "./tax-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tax Configuration | Trovestak Admin",
    description: "Regional tax compliance and rate management.",
};

const TAX_ZONES = [
    { zone: "Kenya (KRA)", rate: 16, type: "VAT", status: "Active", code: "KE-VAT-16" },
    { zone: "Uganda (URA)", rate: 18, type: "VAT", status: "Active", code: "UG-VAT-18" },
    { zone: "Tanzania (TRA)", rate: 18, type: "VAT", status: "Active", code: "TZ-VAT-18" },
    { zone: "Rwanda (RRA)", rate: 18, type: "VAT", status: "Active", code: "RW-VAT-18" },
    { zone: "United States", rate: 0, type: "State-variable", status: "Active", code: "US-TAX" },
    { zone: "European Union", rate: 20, type: "VAT", status: "Active", code: "EU-VAT" },
];

export default async function FinanceTaxPage() {
    // In a real scenario, we might fetch these from a tax_zones table.
    // For now, we use the static definitions while removing legacy Supabase client.
    const supabase = await createSupabaseServerClient();

    // Optional: Fetch store tax settings from a config table if it exists
    // const { data: settings } = await supabase.from('store_settings').select('*').eq('key', 'tax_config').single();

    return (
        <TaxClient initialZones={TAX_ZONES} />
    );
}
