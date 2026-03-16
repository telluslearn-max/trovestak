"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin/activity";

export async function updateProductFull(id: string, data: {
  product?: {
    name?: string;
    short_name?: string;
    subtitle?: string;
    description?: string;
    nav_category?: string;
    nav_subcategory?: string;
    nav_section?: string;
    nav_url?: string;
    brand_type?: string;
    badge?: string;
    seo_description?: string;
    is_active?: boolean;
    tags?: string;
    thumbnail_url?: string;
    gallery_urls?: string[];
  };
  pricing?: {
    cost_price?: number;
    sell_price?: number;
    discount_percent?: number;
    compare_price?: number;
  };
  variants?: Array<{
    name: string;
    price: number;
    cost: number;
    stock: number;
    sku: string;
    options: Record<string, string>;
    attribute_value_ids?: string[];
  }>;
  specs?: Record<string, Record<string, string>>;
  content?: {
    overview?: string;
    features?: Array<{ icon: string; title: string; desc: string }>;
    faq?: Array<{ q: string; a: string }>;
    highlights?: Array<{ key: string; value: string }>;
  };
}) {
  const supabase = await createSupabaseServerClient();

  try {
    // Update product core fields
    if (data.product) {
      const { error: productError } = await supabase
        .from("products")
        .update({
          ...data.product,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (productError) throw new Error(productError.message);
    }

    // Update pricing
    if (data.pricing) {
      const { data: existingPricing } = await supabase
        .from("product_pricing")
        .select("id")
        .eq("product_id", id)
        .single();

      if (existingPricing) {
        const { error: pricingError } = await supabase
          .from("product_pricing")
          .update({
            cost_price: data.pricing.cost_price,
            sell_price: data.pricing.sell_price,
            discount_percent: data.pricing.discount_percent,
            compare_price: data.pricing.compare_price,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", id);

        if (pricingError) throw new Error(pricingError.message);
      } else {
        const { error: pricingError } = await supabase
          .from("product_pricing")
          .insert({
            product_id: id,
            cost_price: data.pricing.cost_price || 0,
            sell_price: data.pricing.sell_price || 0,
            discount_percent: data.pricing.discount_percent || 0,
            compare_price: data.pricing.compare_price,
            currency: "KES",
          });

        if (pricingError) throw new Error(pricingError.message);
      }
    }

    // Update variants (New system into product_variants table)
    if (data.variants && data.variants.length > 0) {
      // Delete existing variants (cascade removes variant_attribute_values)
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", id);

      // Insert new variants
      const variantsToInsert = data.variants.map((v) => ({
        product_id: id,
        name: v.name,
        price_kes: v.price * 100,
        cost_price: v.cost,
        stock_quantity: v.stock,
        sku: v.sku,
        options: v.options,
      }));

      const { data: insertedVariants, error: variantsError } = await supabase
        .from("product_variants")
        .insert(variantsToInsert)
        .select("id");

      if (variantsError) throw new Error(variantsError.message);

      // Persist variant_attribute_values if attribute_value_ids are present
      if (insertedVariants && insertedVariants.length > 0) {
        const vavRows: { variant_id: string; attribute_value_id: string }[] = [];
        for (let i = 0; i < data.variants.length; i++) {
          const avIds = data.variants[i].attribute_value_ids;
          if (avIds && avIds.length > 0 && insertedVariants[i]) {
            for (const avId of avIds) {
              vavRows.push({ variant_id: insertedVariants[i].id, attribute_value_id: avId });
            }
          }
        }
        if (vavRows.length > 0) {
          const { error: vavErr } = await supabase
            .from("variant_attribute_values")
            .insert(vavRows);
          if (vavErr) console.error("variant_attribute_values insert error:", vavErr.message);
        }

        // Derive and persist product_attribute_assignments from used attribute values
        const allAvIds = Array.from(new Set(vavRows.map(r => r.attribute_value_id)));
        if (allAvIds.length > 0) {
          const { data: avData } = await supabase
            .from("attribute_values")
            .select("attribute_id")
            .in("id", allAvIds);
          if (avData) {
            const uniqueAttrIds = Array.from(new Set(avData.map(r => r.attribute_id)));
            // Clear existing assignments for this product
            await supabase
              .from("product_attribute_assignments")
              .delete()
              .eq("product_id", id);
            // Insert fresh assignments
            if (uniqueAttrIds.length > 0) {
              const { error: paaErr } = await supabase
                .from("product_attribute_assignments")
                .insert(uniqueAttrIds.map(aid => ({ product_id: id, attribute_id: aid })));
              if (paaErr) console.error("product_attribute_assignments insert error:", paaErr.message);
            }
          }
        }
      }

      // Update total stock on parent product
      const totalStock = data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      await supabase
        .from("products")
        .update({ stock_quantity: totalStock, product_type: "variable" })
        .eq("id", id);
    }

    // Update specs
    if (data.specs) {
      const { data: existingSpecs } = await supabase
        .from("product_specs")
        .select("id")
        .eq("product_id", id)
        .single();

      if (existingSpecs) {
        const { error: specsError } = await supabase
          .from("product_specs")
          .update({
            spec_data: data.specs,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", id);

        if (specsError) throw new Error(specsError.message);
      } else {
        const { error: specsError } = await supabase
          .from("product_specs")
          .insert({
            product_id: id,
            spec_data: data.specs,
          });

        if (specsError) throw new Error(specsError.message);
      }
    }

    // Update content
    if (data.content) {
      const { data: existingContent } = await supabase
        .from("product_content")
        .select("id")
        .eq("product_id", id)
        .single();

      if (existingContent) {
        const { error: contentError } = await supabase
          .from("product_content")
          .update({
            overview: data.content.overview,
            features: data.content.features || [],
            faq: data.content.faq || [],
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", id);

        if (contentError) throw new Error(contentError.message);
      } else {
        const { error: contentError } = await supabase
          .from("product_content")
          .insert({
            product_id: id,
            overview: data.content.overview || "",
            features: data.content.features || [],
            faq: data.content.faq || [],
          });

        if (contentError) throw new Error(contentError.message);
      }
    }

    await logAdminActivity({
      action: "UPDATE_PRODUCT_FULL",
      resource: "products",
      resourceId: id,
      metadata: { name: data.product?.name },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating product:", error);
    throw new Error(error.message || "Failed to update product");
  }
}

export async function updateProductPricing(
  productId: string,
  pricing: {
    cost_price: number;
    sell_price: number;
    discount_percent: number;
    compare_price?: number;
  }
) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("product_pricing")
    .select("id")
    .eq("product_id", productId)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("product_pricing")
      .update({
        cost_price: pricing.cost_price,
        sell_price: pricing.sell_price,
        discount_percent: pricing.discount_percent,
        compare_price: pricing.compare_price,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId));
  } else {
    ({ error } = await supabase.from("product_pricing").insert({
      product_id: productId,
      ...pricing,
      currency: "KES",
    }));
  }

  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: "UPDATE_PRICING",
    resource: "product_pricing",
    resourceId: productId,
    metadata: pricing,
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function addProductVariant(
  productId: string,
  variant: {
    variant_type: string;
    variant_name: string;
    hex_primary?: string;
    hex_secondary?: string;
    price_delta?: number;
    is_default?: boolean;
  }
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name: variant.variant_name,
    price_kes: variant.price_delta ?? 0,
    options: {
      type: variant.variant_type,
      ...(variant.hex_primary && { hex_primary: variant.hex_primary }),
      ...(variant.hex_secondary && { hex_secondary: variant.hex_secondary }),
      ...(variant.is_default !== undefined && { is_default: variant.is_default }),
    },
  });

  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: "ADD_VARIANT",
    resource: "product_variants",
    resourceId: productId,
    metadata: variant,
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteProductVariant(variantId: string, productId: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: "DELETE_VARIANT",
    resource: "product_variants",
    resourceId: variantId,
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function updateProductSpecs(
  productId: string,
  specs: Record<string, Record<string, string>>
) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("product_specs")
    .select("id")
    .eq("product_id", productId)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("product_specs")
      .update({
        spec_data: specs,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId));
  } else {
    ({ error } = await supabase.from("product_specs").insert({
      product_id: productId,
      spec_data: specs,
    }));
  }

  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: "UPDATE_SPECS",
    resource: "product_specs",
    resourceId: productId,
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function updateProductContent(
  productId: string,
  content: {
    overview?: string;
    features?: Array<{ icon: string; title: string; desc: string }>;
    faq?: Array<{ q: string; a: string }>;
    highlights?: Array<{ key: string; value: string }>;
  }
) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("product_content")
    .select("id")
    .eq("product_id", productId)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("product_content")
      .update({
        overview: content.overview,
        features: content.features,
        faq: content.faq,
        highlights: content.highlights,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId));
  } else {
    ({ error } = await supabase.from("product_content").insert({
      product_id: productId,
      overview: content.overview || "",
      features: content.features || [],
      faq: content.faq || [],
      highlights: content.highlights || [],
    }));
  }

  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: "UPDATE_CONTENT",
    resource: "product_content",
    resourceId: productId,
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function toggleProductAddon(
  productId: string,
  addonType: "bnpl" | "trade_in" | "shipping" | "insurance",
  isEnabled: boolean
) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("product_addons")
    .select("id")
    .eq("product_id", productId)
    .eq("addon_type", addonType)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("product_addons")
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId)
      .eq("addon_type", addonType));
  } else {
    ({ error } = await supabase.from("product_addons").insert({
      product_id: productId,
      addon_type: addonType,
      is_enabled: isEnabled,
    }));
  }

  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: "TOGGLE_ADDON",
    resource: "product_addons",
    resourceId: productId,
    metadata: { addonType, isEnabled },
  });

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function applyBulkDiscount(
  productIds: string[],
  discountPercent: number
) {
  const supabase = await createSupabaseServerClient();

  for (const productId of productIds) {
    const { data: pricing } = await supabase
      .from("product_pricing")
      .select("sell_price")
      .eq("product_id", productId)
      .single();

    if (pricing) {
      const newSellPrice = Math.round(
        pricing.sell_price * (1 - discountPercent / 100)
      );

      await supabase
        .from("product_pricing")
        .update({
          sell_price: newSellPrice,
          discount_percent: discountPercent,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", productId);
    }
  }

  await logAdminActivity({
    action: "BULK_DISCOUNT",
    resource: "products",
    resourceId: productIds.join(","),
    metadata: { discountPercent },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function regenerateProductFromJSON(
  productId: string,
  jsonData: any
) {
  const supabase = await createSupabaseServerClient();

  try {
    // Update product
    await supabase
      .from("products")
      .update({
        name: jsonData.product.name,
        short_name: jsonData.product.short_name,
        subtitle: jsonData.product.subtitle,
        description: jsonData.content?.overview,
        nav_category: jsonData.product.category,
        nav_subcategory: jsonData.product.subcategory,
        brand_type: jsonData.product.brand_type,
        badge: jsonData.product.badge,
        warranty: jsonData.product.warranty,
        seo_title: jsonData.product.name + " | Trovestak Kenya",
        seo_description: jsonData.content?.overview?.substring(0, 160) || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    // Update pricing
    const { data: existingPricing } = await supabase
      .from("product_pricing")
      .select("id")
      .eq("product_id", productId)
      .single();

    if (existingPricing) {
      await supabase
        .from("product_pricing")
        .update({
          cost_price: jsonData.pricing?.cost_price || 0,
          sell_price: jsonData.pricing?.sell_price || 0,
          discount_percent: jsonData.pricing?.discount_percent || 0,
          compare_price: jsonData.pricing?.compare_price,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", productId);
    } else {
      await supabase.from("product_pricing").insert({
        product_id: productId,
        cost_price: jsonData.pricing?.cost_price || 0,
        sell_price: jsonData.pricing?.sell_price || 0,
        discount_percent: jsonData.pricing?.discount_percent || 0,
        compare_price: jsonData.pricing?.compare_price,
        currency: "KES",
      });
    }

    // Update specs
    if (jsonData.content?.specs) {
      const { data: existingSpecs } = await supabase
        .from("product_specs")
        .select("id")
        .eq("product_id", productId)
        .single();

      if (existingSpecs) {
        await supabase
          .from("product_specs")
          .update({
            spec_data: jsonData.content.specs,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", productId);
      } else {
        await supabase.from("product_specs").insert({
          product_id: productId,
          spec_data: jsonData.content.specs,
        });
      }
    }

    // Update content
    if (jsonData.content) {
      const { data: existingContent } = await supabase
        .from("product_content")
        .select("id")
        .eq("product_id", productId)
        .single();

      if (existingContent) {
        await supabase
          .from("product_content")
          .update({
            overview: jsonData.content.overview,
            features: jsonData.content.features || [],
            faq: jsonData.content.faq || [],
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", productId);
      } else {
        await supabase.from("product_content").insert({
          product_id: productId,
          overview: jsonData.content.overview || "",
          features: jsonData.content.features || [],
          faq: jsonData.content.faq || [],
        });
      }
    }

    await logAdminActivity({
      action: "REGENERATE_FROM_JSON",
      resource: "products",
      resourceId: productId,
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to regenerate product");
  }
}
