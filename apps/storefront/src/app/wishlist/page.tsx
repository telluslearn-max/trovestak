import { getWishlistItemsAction } from "./actions";
import WishlistClient from "./wishlist-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Wishlist | Trovestak",
    description: "Save items you love and prepare for your next deployment.",
};

export default async function WishlistPage() {
    // Fetch initial items on the server
    const { items } = await getWishlistItemsAction();

    return (
        <WishlistClient initialItems={items || []} />
    );
}
