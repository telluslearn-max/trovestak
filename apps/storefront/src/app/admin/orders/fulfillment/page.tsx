import { Metadata } from "next";
import FulfillmentClient from "./fulfillment-client";
import { getFulfillmentQueue, getRidersAction } from "./fulfillment-actions";

export const metadata: Metadata = {
    title: "Dispatch Queue | Trovestak Admin",
    description: "Assign riders and dispatch paid orders.",
};

export default async function AdminFulfillmentPage() {
    const [orders, riders] = await Promise.all([
        getFulfillmentQueue().catch(() => []),
        getRidersAction().catch(() => []),
    ]);

    return <FulfillmentClient initialOrders={orders} riders={riders} />;
}
