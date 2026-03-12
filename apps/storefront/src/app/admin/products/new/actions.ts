"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
}

export async function createProductAction(formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const category_id = formData.get("category_id") as string || null;
    const brand_type = formData.get("brand_type") as string;
    const nav_category = formData.get("nav_category") as string;
    const nav_subcategory = formData.get("nav_subcategory") as string;
    const content_overview = formData.get("content_overview") as string;
    const variantsJson = formData.get("variants_json") as string;
    const specsJson = formData.get("specs_json") as string;

    // PDP-specific fields
    const featuresJson = formData.get("features_json") as string | null;
    const qaJson = formData.get("qa_json") as string | null;
    const colorsJson = formData.get("colors_json") as string | null;
    const addonsJson = formData.get("addons_json") as string | null;
    const tradeInJson = formData.get("trade_in_json") as string | null;
    const badge = formData.get("badge") as string | null;
    const comparePriceStr = formData.get("compare_price") as string | null;
    const warranty = formData.get("warranty") as string | null;
    const availability = formData.get("availability") as string | null;

    if (!name || !variantsJson) {
        return { success: false, error: "Missing required fields" };
    }

    const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 8)}`;

    // 1. Parse Specs into grouped JSONB structure (now supports groups)
    let content_specifications: Record<string, Record<string, string>> = {};
    try {
        const specGroups = JSON.parse(specsJson ?? "[]");
        specGroups.forEach((group: any) => {
            if (group.groupName && group.items && group.items.length > 0) {
                const groupItems: Record<string, string> = {};
                group.items.forEach((item: any) => {
                    if (item.key && item.value) {
                        groupItems[item.key] = item.value;
                    }
                });
                if (Object.keys(groupItems).length > 0) {
                    content_specifications[group.groupName] = groupItems;
                }
            }
        });
    } catch (e) {
        console.error("Spec parse error", e);
    }

    // 2. Parse feature cards
    let content_features: any[] = [];
    try {
        content_features = JSON.parse(featuresJson ?? "[]");
    } catch (e) { }

    // 3. Parse FAQ / QA
    let content_qa: any[] = [];
    try {
        content_qa = JSON.parse(qaJson ?? "[]");
    } catch (e) { }

    // 4. Parse colors and addons into metadata
    let colors: any[] = [];
    try {
        colors = JSON.parse(colorsJson ?? "[]");
    } catch (e) { }

    let addons: Record<string, any> = {};
    try {
        addons = JSON.parse(addonsJson ?? "{}");
    } catch (e) { }

    let trade_in_devices: any[] = [];
    try {
        trade_in_devices = JSON.parse(tradeInJson ?? "[]");
    } catch (e) { }

    const comparePrice = comparePriceStr ? parseFloat(comparePriceStr) : undefined;

    const metadata: Record<string, any> = {
        ...(badge ? { badge } : {}),
        ...(comparePrice ? { compare_price: comparePrice } : {}),
        ...(warranty ? { warranty } : {}),
        ...(availability ? { availability } : {}),
        ...(colors.length > 0 ? { colors } : {}),
        ...(Object.keys(addons).length > 0 ? { addons } : {}),
        ...(trade_in_devices.length > 0 ? { trade_in_devices } : {}),
        breadcrumb: ["Home", nav_category || "Store", brand_type || "Brand"].filter(Boolean),
    };

    // 5. Create Product record
    const supabase = await createSupabaseServerClient();
    const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
            name,
            slug,
            description,
            thumbnail_url: image_url,
            category_id: category_id === "" ? null : category_id,
            brand_type,
            nav_category: nav_category || null,
            nav_subcategory: nav_subcategory || null,
            content_overview,
            content_specifications,
            content_features,
            content_qa,
            metadata,
            enrichment_status: "approved",
            is_active: true,
        })
        .select()
        .single();

    if (productError || !product) {
        console.error("Product creation error:", productError);
        return { success: false, error: productError?.message ?? "Failed to create product record" };
    }

    // 6. Create Variants
    try {
        const variantInputs = JSON.parse(variantsJson);
        const variantsToInsert = variantInputs.map((v: any, idx: number) => ({
            product_id: product.id,
            name: v.name || "Standard",
            options: {
                storage: v.storage || null,
                color: v.color || null,
                is_default: idx === 0,
                desc: v.storage ? `${v.storage} · ${v.color || ""}`.trim().replace(/·\s*$/, "") : null,
            },
            price_kes: v.price_kes ? Math.round(parseFloat(v.price_kes) * 100) : 0,
            stock_quantity: v.stock_quantity || 0,
            sku: `${slug}-${slugify(v.storage || `v${idx}`)}-${slugify(v.color || "std")}`,
        }));

        const { error: variantError } = await supabase.from("product_variants").insert(variantsToInsert);

        if (variantError) {
            console.error("Variant creation error:", variantError);
            return { success: false, error: "Product created, but variants failed." };
        }
    } catch (e) {
        console.error("Variant parse error:", e);
        return { success: false, error: "Invalid variant data." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/store", "page");
    revalidatePath(`/products/${slug}`, "page");

    return { success: true, id: product.id, slug };
}
