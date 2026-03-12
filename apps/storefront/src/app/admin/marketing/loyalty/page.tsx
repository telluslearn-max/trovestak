import { createSupabaseServerClient } from "@/lib/supabase-server";
import LoyaltyProgramClient from "./loyalty-client";
import { Metadata } from "next";
import { T } from "@/components/admin/ui-pro";

export const metadata: Metadata = {
    title: "Loyalty Program | Trovestak Admin",
    description: "Customer rewards and tier management.",
};

const TIERS = [
    { name: "Bronze", min: 0, max: 999, color: "#b45309", count: 0 },
    { name: "Silver", min: 1000, max: 4999, color: T.textSub, count: 0 },
    { name: "Gold", min: 5000, max: 19999, color: T.orange, count: 0 },
    { name: "Platinum", min: 20000, max: Infinity, color: T.purple, count: 0 },
];

export default async function AdminLoyaltyProgramPage() {
    const supabase = await createSupabaseServerClient();

    const { data: rawCustomers, error } = await supabase
        .from("customers")
        .select("id, full_name, email, loyalty_points, created_at")
        .order("loyalty_points", { ascending: false });

    if (error) {
        console.error("Error fetching customers for loyalty program:", error);
    }

    const customers = rawCustomers || [];
    const totalPts = customers.reduce((a: number, c: any) => a + (c.loyalty_points || 0), 0);

    // Assign tiers and update counts
    const withTiers = customers.map(c => {
        const pts = c.loyalty_points || 0;
        const tier = TIERS.slice().reverse().find(t => pts >= t.min) || TIERS[0];
        return { ...c, tier };
    });

    const tierCounts = TIERS.map(t => ({
        ...t,
        count: withTiers.filter(c => c.tier.name === t.name).length,
    }));

    const stats = {
        total: customers.length,
        avgPoints: customers.length ? Math.round(totalPts / customers.length) : 0,
        totalRedeemed: 0,
    };

    return (
        <LoyaltyProgramClient
            initialCustomers={withTiers.slice(0, 100)}
            tiers={tierCounts}
            stats={stats}
        />
    );
}
