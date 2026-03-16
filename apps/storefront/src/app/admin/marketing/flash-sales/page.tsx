import { Metadata } from "next";
import FlashSalesClient from "./flash-sales-client";
import { getFlashSales } from "../actions";

export const metadata: Metadata = {
    title: "Flash Sales | Trovestak Admin",
    description: "Urgency-driven, time-limited promotions.",
};

export default async function AdminFlashSalesPage() {
    const sales = await getFlashSales().catch(() => []);
    return <FlashSalesClient initialSales={sales} />;
}
