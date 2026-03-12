import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Calculates the virtual stock of a bundle based on its components.
 * 
 * For Fixed Bundles: 
 * Stock = MIN(component_variant_stock / quantity_required)
 * 
 * For Configurable Kits: 
 * Stock = Total sum of all options' stock in all required slots? 
 * Actually, for Kits it's more complex. Typically we show "In Stock" 
 * if at least one option in every REQUIRED slot is available.
 * But for this implementation, we'll return the MIN availability 
 * across required slots.
 */
export async function getBundleStock(bundleId: string) {
    const supabase = await createSupabaseServerClient();

    // Fetch bundle with items and slots
    const { data: bundle, error } = await supabase
        .from("bundles")
        .select(`
      bundle_type,
      bundle_items (
        quantity,
        product_variants (stock_quantity)
      ),
      bundle_slots (
        required,
        bundle_slot_options (
          product_variants (stock_quantity)
        )
      )
    `)
        .eq("id", bundleId)
        .single();

    if (error || !bundle) return 0;

    if (bundle.bundle_type === "fixed") {
        if (!bundle.bundle_items || bundle.bundle_items.length === 0) return 0;

        const stocks = bundle.bundle_items.map((item: any) => {
            const variantStock = item.product_variants?.stock_quantity || 0;
            const qtyNeeded = item.quantity || 1;
            return Math.floor(variantStock / qtyNeeded);
        });

        return Math.min(...stocks);
    } else {
        // Configurable Kit
        // A kit is available if every REQUIRED slot has at least one option in stock.
        // The "stock number" is the sum of available options in the most restricted required slot.
        const requiredSlots = bundle.bundle_slots?.filter((s: any) => s.required) || [];
        if (requiredSlots.length === 0) return 999; // Unlimited if no required slots (not typical)

        const slotAvailabilities = requiredSlots.map((slot: any) => {
            // Sum of stock across all options in this slot
            const totalSlotStock = slot.bundle_slot_options?.reduce((acc: number, opt: any) => {
                return acc + (opt.product_variants?.stock_quantity || 0);
            }, 0);
            return totalSlotStock || 0;
        });

        return Math.min(...slotAvailabilities);
    }
}

/**
 * Bulk updates the 'virtual_stock' field for bundles (if we decide to cache it)
 * or just provides a way to fetch all bundle stocks for the list view.
 */
export async function getAllBundleStocks() {
    const supabase = await createSupabaseServerClient();
    const { data: bundles } = await supabase.from("bundles").select("id");
    if (!bundles) return {};

    const results: Record<string, number> = {};
    for (const b of bundles) {
        results[b.id] = await getBundleStock(b.id);
    }
    return results;
}
