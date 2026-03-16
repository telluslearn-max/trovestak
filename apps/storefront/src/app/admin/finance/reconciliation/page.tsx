import { Metadata } from "next";
import ReconciliationClient from "./reconciliation-client";
import { getFinanceSummary, getMpesaReconciliation, getRevenueByDay } from "../actions";

export const metadata: Metadata = {
    title: "M-Pesa Reconciliation | Trovestak Admin",
    description: "Match M-Pesa receipts to orders and reconcile daily revenue.",
};

export default async function ReconciliationPage() {
    const [summary, orders, revenueData] = await Promise.all([
        getFinanceSummary().catch(() => ({
            grossRevenue: 0, mpesaRevenue: 0, manualRevenue: 0, codRevenue: 0,
            paidOrderCount: 0, unpaidOrderCount: 0, avgOrderValue: 0,
        })),
        getMpesaReconciliation().catch(() => []),
        getRevenueByDay(30).catch(() => []),
    ]);

    return (
        <ReconciliationClient
            summary={summary}
            orders={orders}
            revenueData={revenueData}
        />
    );
}
