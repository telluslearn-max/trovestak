import { createSupabaseServerClient } from "@/lib/supabase-server";
import EmailCampaignsClient from "./email-campaigns-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Email Campaigns | Trovestak Admin",
    description: "Direct communications with your customer base.",
};

const CAMPAIGNS = [
    { name: "March Launch Newsletter", status: "Sent", recipients: 18421, opens: 4462, clicks: 1124, date: "Mar 5" },
    { name: "Low Stock Alert Blast", status: "Sent", recipients: 8302, opens: 2016, clicks: 412, date: "Mar 3" },
    { name: "Weekend Flash Sale", status: "Scheduled", recipients: 20000, opens: 0, clicks: 0, date: "Mar 8" },
    { name: "New Arrivals – Sony", status: "Draft", recipients: 0, opens: 0, clicks: 0, date: "—" },
];

export default async function AdminEmailCampaignsPage() {
    const supabase = await createSupabaseServerClient();

    // In a production environment, we would fetch these from a 'marketing_campaigns' table.
    // For now, we move the static definitions to the server to maintain consistency.
    // const { data: campaigns } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false });

    const stats = {
        totalSubscribers: "18.4k",
        avgOpenRate: "24.2%",
        avgCTR: "6.1%",
    };

    return (
        <EmailCampaignsClient campaigns={CAMPAIGNS} stats={stats} />
    );
}
