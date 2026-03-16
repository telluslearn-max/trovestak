import { Metadata } from "next";
import PromotionsClient from "./promotions-client";
import { getDiscountCodes } from "../actions";

export const metadata: Metadata = {
    title: "Discount Codes | Trovestak Admin",
    description: "Create and manage promo codes.",
};

export default async function AdminPromotionsPage() {
    const codes = await getDiscountCodes().catch(() => []);
    return <PromotionsClient initialCodes={codes} />;
}
