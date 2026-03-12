import { createSupabaseServerClient } from "@/lib/supabase-server";
import SuppliersClient from "./suppliers-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Supplier Directory | Trovestak Admin",
    description: "Manage your global network of procurement partners and track reliability metrics.",
};

export default async function SuppliersPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("supplier")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching suppliers:", error);
    }

    return (
        <SuppliersClient initialSuppliers={data || []} />
    );
}
