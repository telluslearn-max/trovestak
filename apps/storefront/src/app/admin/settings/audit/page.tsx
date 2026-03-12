import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuditLogsClient from "./audit-logs-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Audit Logs | Trovestak Admin",
    description: "Immutable record of administrative activity.",
};

export default async function AdminAuditLogsPage() {
    const supabase = await createSupabaseServerClient();

    const { data: logs, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching audit logs:", error);
    }

    return (
        <AuditLogsClient initialLogs={logs || []} />
    );
}
