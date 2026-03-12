import { supabase } from "./supabase";

export async function seedTestData() {
    console.log("Seeding test data...");

    // 1. Get some products
    const { data: products } = await supabase.from("products").select("id, price").limit(5);
    if (!products || products.length === 0) {
        console.error("No products found to seed orders.");
        return;
    }

    // 2. Get or create some customers (profiles)
    const { data: profiles } = await supabase.from("profiles").select("id").limit(3);
    if (!profiles || profiles.length === 0) {
        console.log("No profiles found to link orders.");
    }

    const customerId = profiles?.[0]?.id;

    // 3. Generate some orders for the past 30 days
    const now = new Date();
    const orders = [];

    for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const subtotal = products[Math.floor(Math.random() * products.length)].price;

        orders.push({
            customer_id: customerId,
            total_amount: subtotal + 500, // + shipping
            status: ["pending", "processing", "shipped", "delivered"][Math.floor(Math.random() * 4)],
            payment_status: "paid",
            created_at: orderDate.toISOString(),
            shipping_address: {
                full_name: "Test Customer",
                phone: "0712345678",
                city: "Nairobi",
                area: "Westlands",
                details: "Test Street 123"
            }
        });
    }

    const { error: orderError } = await supabase.from("orders").insert(orders);
    if (orderError) console.error("Error seeding orders:", orderError);
    else console.log("Seeded 20 orders.");

    return { success: !orderError };
}
