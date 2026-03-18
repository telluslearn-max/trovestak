import { getWishlistItemsAction } from "./actions";
import WishlistClient from "./wishlist-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Saves | Trovestak",
    description: "Your saved products and price-drop alerts.",
};

export default async function WishlistPage() {
    // Fetch initial items on the server
    const { items } = await getWishlistItemsAction();

    return (
        <WishlistClient initialItems={items || []} />
    );
}
