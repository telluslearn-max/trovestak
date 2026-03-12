import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ProductRow {
  id?: string;
  sku?: string;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  product_type?: string;
  category_path?: string;
  brand?: string;
  brand_type?: string;
  warranty?: string;
  badge?: string;
  nav_category?: string;
  nav_subcategory?: string;
  thumbnail_url?: string;
  gallery_urls?: string;
  type?: string;
  tags?: string;
  visibility?: string;
  is_featured?: string;
  purchase_note?: string;
  menu_order?: number;
  is_active?: string;
  allow_backorders?: string;
  low_stock_threshold?: number;
  cost_price?: number;
  regular_price?: number;
  sell_price?: number;
  sale_price_start?: string;
  sale_price_end?: string;
  stock_quantity?: number;
  stock_status?: string;
  specifications?: string;
  features?: string;
  highlights?: string;
  overview?: string;
  bnpl?: string;
  trade_in?: string;
  shipping?: string;
  insurance?: string;
  variant_attributes?: string;
  variant_pricing?: string;
  upsell_ids?: string;
  crosssell_ids?: string;
  availability?: string;
  discount_percent?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  variants_json?: string;
  specs_json?: string;
  content_json?: string;
  addons_json?: string;
}

function parseCSV(text: string): ProductRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const rows: ProductRow[] = [];

  // Build header to field mapping
  const headerMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  // Parse rows - only rows with a valid name are actual products
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comment lines
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;
    
    const values = parseCSVLineValues(line, headers.length);
    const name = values.name;
    
    // Skip rows without a name (these are section headers or metadata rows)
    if (!name || name === "") continue;
    
    rows.push(values as unknown as ProductRow);
  }

  return rows;
}

function parseCSVLineValues(line: string, expectedFields: number): Record<string, string> {
  const result: Record<string, string> = {};
  
  let current = "";
  let inQuotes = false;
  let fieldIndex = 0;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result[`field_${fieldIndex}`] = current.trim();
      current = "";
      fieldIndex++;
      if (fieldIndex >= expectedFields) break;
    } else {
      current += char;
    }
  }
  
  if (fieldIndex < expectedFields) {
    result[`field_${fieldIndex}`] = current.trim();
  }
  
  // Map to header names
  const mapped: Record<string, string> = {};
  const headers = [
    "name", "slug", "description", "short_description", "brand_type", "warranty", "badge",
    "nav_category", "nav_subcategory", "thumbnail_url", "gallery_urls", "type", "sku",
    "is_featured", "is_active", "availability", "cost_price", "regular_price", "sale_price",
    "sale_price_start", "sale_price_end", "discount_percent", "seo_title", "seo_description",
    "seo_keywords", "variants_json", "specs_json", "content_json", "addons_json",
    "id", "product_type", "category_path", "brand", "tags", "visibility", "is_featured",
    "purchase_note", "menu_order", "is_active", "allow_backorders", "low_stock_threshold",
    "cost_price", "regular_price", "sell_price", "stock_quantity", "stock_status",
    "specifications", "features", "highlights", "overview", "bnpl", "trade_in",
    "shipping", "insurance", "variant_attributes", "variant_pricing", "upsell_ids", "crosssell_ids"
  ];
  
  headers.forEach((header, idx) => {
    const key = `field_${idx}`;
    if (result[key] !== undefined) {
      mapped[header] = result[key];
    }
  });
  
  return mapped;
}

async function ensureCategories(supabaseAdmin: any, categoryPath: string): Promise<string | null> {
  if (!categoryPath) return null;
  
  const parts = categoryPath.split(">").map((p) => p.trim());
  if (parts.length === 0) return null;
  
  let parentId: string | null = null;
  let finalCategoryId: string | null = null;
  
  for (const part of parts) {
    const slug = part.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Check if category exists (use maybeSingle to avoid error if not found)
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    
    if (existing) {
      parentId = existing.id;
      finalCategoryId = existing.id;
    } else {
      // Create category
      const { data: newCategory, error: createError }: { data: { id: string } | null, error: any } = await supabaseAdmin
        .from("categories")
        .insert({
          name: part,
          slug: slug,
          parent_id: parentId,
          is_active: true,
        })
        .select("id")
        .single();
      
      if (!createError && newCategory) {
        parentId = newCategory.id;
        finalCategoryId = newCategory.id;
      } else if (createError) {
        console.error("Error creating category:", part, createError.message);
      }
    }
  }
  
  return finalCategoryId;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found in CSV" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const results: { row: number; status: string; name: string; error?: string }[] = [];
    const BATCH_SIZE = 50;

    // Group rows by base SKU to handle variable products
    const productGroups: Record<string, ProductRow[]> = {};
    
    for (const row of rows) {
      if (!row.name?.trim()) continue;
      
      // Extract base SKU (remove variant suffix like -256GB, -512GB)
      let baseSku = row.sku || "";
      // Try to detect base SKU by removing common suffixes
      baseSku = baseSku.replace(/-256GB|-512GB|-1TB|-128GB|-1TB|-64GB|-SIM$/i, "");
      if (!baseSku) {
        baseSku = row.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      
      if (!productGroups[baseSku]) {
        productGroups[baseSku] = [];
      }
      productGroups[baseSku].push(row);
    }

    // Process each product group
    for (const [baseSku, groupRows] of Object.entries(productGroups)) {
      const row = groupRows[0]; // Use first row for main product data
      const rowNum = 2;

      try {
        if (!row.name?.trim()) {
          results.push({ row: rowNum, status: "skipped", name: row.name || "Unnamed", error: "Name is required - row skipped" });
          continue;
        }

        // Validate SKU
        if (!row.sku?.trim()) {
          results.push({ row: rowNum, status: "error", name: row.name, error: "SKU is required. Please provide a unique SKU for this product." });
          continue;
        }

        // Validate variants_json if present
        if (row.variants_json) {
          try {
            JSON.parse(row.variants_json);
          } catch (e) {
            results.push({ row: rowNum, status: "error", name: row.name, error: "Invalid variants_json format. Please check JSON syntax." });
            continue;
          }
        }

        // Validate specs_json if present
        if (row.specs_json) {
          try {
            JSON.parse(row.specs_json);
          } catch (e) {
            results.push({ row: rowNum, status: "error", name: row.name, error: "Invalid specs_json format. Please check JSON syntax." });
            continue;
          }
        }

        // Validate content_json if present
        if (row.content_json) {
          try {
            JSON.parse(row.content_json);
          } catch (e) {
            results.push({ row: rowNum, status: "error", name: row.name, error: "Invalid content_json format. Please check JSON syntax." });
            continue;
          }
        }

        // Validate addons_json if present
        if (row.addons_json) {
          try {
            JSON.parse(row.addons_json);
          } catch (e) {
            results.push({ row: rowNum, status: "error", name: row.name, error: "Invalid addons_json format. Please check JSON syntax." });
            continue;
          }
        }

        // Check if product exists by base SKU
        let productId: string | null = null;
        let isUpdate = false;

        const { data: existing } = await supabaseAdmin
          .from("products")
          .select("id")
          .eq("sku", baseSku)
          .maybeSingle();

        if (existing) {
          productId = existing.id;
          isUpdate = true;
        }

        const slug = row.slug || row.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        // Parse variants from variants_json (new format) or variant_pricing (old format)
        let variants: any[] = [];
        if (row.variants_json) {
          try {
            variants = JSON.parse(row.variants_json);
          } catch (e) {
            console.error("Error parsing variants_json:", e);
          }
        } else if (row.variant_pricing) {
          try {
            variants = JSON.parse(row.variant_pricing);
          } catch (e) {
            console.error("Error parsing variant_pricing:", e);
          }
        }

        // If no variants in JSON, create one from the row data
        if (variants.length === 0) {
          variants = [{
            variant: row.sku || row.name,
            cost_price: row.cost_price,
            regular_price: row.regular_price,
            sell_price: row.sell_price,
          }];
        }

        // Use first variant's prices for main product
        const mainVariant = variants[0];
        const productData: any = {
          name: row.name.replace(/\s*[-â€“]\s*(\d+GB|\d+TB).*/i, "").trim(), // Remove variant suffix from name
          slug,
          description: row.description || null,
          short_description: row.short_description || null,
          product_type: variants.length > 1 ? "variable" : "simple",
          regular_price: mainVariant?.regular_price ? Number(mainVariant.regular_price) : (row.regular_price ? Number(row.regular_price) : 0),
          cost_price: mainVariant?.cost_price ? Number(mainVariant.cost_price) : (row.cost_price ? Number(row.cost_price) : 0),
          sell_price: mainVariant?.sell_price ? Number(mainVariant.sell_price) : (row.sell_price ? Number(row.sell_price) : null),
          stock_quantity: null, // Will be calculated from variants
          stock_status: (row.stock_status && ['instock', 'outofstock', 'onbackorder'].includes(row.stock_status.toLowerCase())) ? row.stock_status.toLowerCase() : "instock",
          low_stock_threshold: row.low_stock_threshold ? Number(row.low_stock_threshold) : 5,
          allow_backorders: (row.allow_backorders && ['no', 'notify', 'yes'].includes(row.allow_backorders.toLowerCase())) ? row.allow_backorders.toLowerCase() : "no",
          visibility: (row.visibility && ['catalog', 'search', 'hidden', 'featured'].includes(row.visibility.toLowerCase())) ? row.visibility.toLowerCase() : "catalog",
          is_featured: row.is_featured?.toLowerCase() === "true",
          purchase_note: row.purchase_note || null,
          menu_order: row.menu_order ? Number(row.menu_order) : 0,
          is_active: !row.is_active || row.is_active.toLowerCase() === "true" || row.is_active.toLowerCase() === "1" || row.is_active.toLowerCase() === "yes",
          status: "published",
          sku: baseSku,
          // New fields from mobile.csv template
          nav_category: row.nav_category || null,
          nav_subcategory: row.nav_subcategory || null,
          brand_type: row.brand_type || null,
          warranty: row.warranty || null,
          badge: row.badge || null,
          availability: row.availability || "in_stock",
          thumbnail_url: row.thumbnail_url || null,
          type: row.type || "simple",
          metadata: {
            brand: row.brand || row.brand_type || null,
            tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
            sale_price_start: row.sale_price_start || null,
            sale_price_end: row.sale_price_end || null,
            short_description: row.short_description || null,
            upsell_ids: row.upsell_ids ? row.upsell_ids.split(",").map((id: string) => id.trim()).filter(Boolean) : [],
            crosssell_ids: row.crosssell_ids ? row.crosssell_ids.split(",").map((id: string) => id.trim()).filter(Boolean) : [],
            // SEO fields
            seo_title: row.seo_title || null,
            seo_description: row.seo_description || null,
            seo_keywords: row.seo_keywords || null,
            // Gallery
            gallery: row.gallery_urls ? (() => { try { return JSON.parse(row.gallery_urls); } catch { return []; } })() : [],
          },
        };

        let finalProductId = productId;

        if (isUpdate && productId) {
          await supabaseAdmin.from("products").update(productData).eq("id", productId);
        } else {
          const { data: newProduct, error: insertError } = await supabaseAdmin
            .from("products")
            .insert(productData)
            .select("id")
            .single();

          if (insertError) {
            results.push({ row: rowNum, status: "error", name: row.name, error: insertError.message });
            continue;
          }
          finalProductId = newProduct?.id;
        }

        // Link to category
        if (row.category_path && finalProductId) {
          const categoryId = await ensureCategories(supabaseAdmin, row.category_path);
          if (categoryId) {
            await supabaseAdmin.from("product_categories").delete().eq("product_id", finalProductId);
            await supabaseAdmin.from("product_categories").insert({ product_id: finalProductId, category_id: categoryId, is_primary: true });
          }
        }

        // Delete existing variants if updating
        if (isUpdate && finalProductId) {
          await supabaseAdmin.from("product_variants").delete().eq("product_id", finalProductId);
        }

        // Create variants
        let totalStock = 0;
        for (const variant of variants) {
          const variantPrice = variant.regular_price ? Number(variant.regular_price) * 100 : 0;
          const stockQty = variant.stock_quantity || row.stock_quantity || 10;
          totalStock += Number(stockQty);

          await supabaseAdmin.from("product_variants").insert({
            product_id: finalProductId,
            name: variant.variant || "Default",
            price_kes: variantPrice,
            stock_quantity: Number(stockQty),
            sku: variant.sku || `${baseSku}-${variant.variant}`.replace(/\s+/g, "-"),
            options: variant.options || {},
          });
        }

        // Update total stock
        await supabaseAdmin.from("products").update({ stock_quantity: totalStock }).eq("id", finalProductId);

        if (row.category_path && finalProductId) {
          const categoryId = await ensureCategories(supabaseAdmin, row.category_path);
          
          if (categoryId) {
            await supabaseAdmin
              .from("product_categories")
              .delete()
              .eq("product_id", finalProductId);

            const { error: linkError } = await supabaseAdmin
              .from("product_categories")
              .insert({
                product_id: finalProductId,
                category_id: categoryId,
                is_primary: true,
              });
            
            if (linkError) {
              console.error("Error linking product to category:", linkError.message);
            }
          }
        }

        // Save product content (specs, features, highlights, overview)
        if (finalProductId && (row.specifications || row.features || row.highlights || row.overview)) {
          const contentData: any = {};
          
          if (row.specifications) {
            try {
              contentData.specifications = JSON.parse(row.specifications);
            } catch (e) {
              contentData.specifications = row.specifications;
            }
          }
          if (row.features) {
            try {
              contentData.features = JSON.parse(row.features);
            } catch (e) {
              contentData.features = row.features;
            }
          }
          if (row.highlights) {
            try {
              contentData.highlights = JSON.parse(row.highlights);
            } catch (e) {
              contentData.highlights = row.highlights;
            }
          }
          if (row.overview) {
            contentData.overview = row.overview;
          }

          // Check if content exists
          const { data: existingContent } = await supabaseAdmin
            .from("product_content")
            .select("id")
            .eq("product_id", finalProductId)
            .maybeSingle();

          if (existingContent) {
            await supabaseAdmin
              .from("product_content")
              .update(contentData)
              .eq("product_id", finalProductId);
          } else {
            await supabaseAdmin
              .from("product_content")
              .insert({
                product_id: finalProductId,
                ...contentData,
              });
          }
        }

        // Save product addons (bnpl, trade_in, shipping, insurance)
        if (finalProductId && (row.bnpl || row.trade_in || row.shipping || row.insurance)) {
          const addonTypes = [
            { key: "bnpl", label: "Buy Now Pay Later" },
            { key: "trade_in", label: "Trade In" },
            { key: "shipping", label: "Shipping" },
            { key: "insurance", label: "Insurance" },
          ];

          for (const addon of addonTypes) {
            const isEnabled = String(row[addon.key as keyof ProductRow] ?? "").toLowerCase() === "true";
            
            // Check if addon exists
            const { data: existingAddon } = await supabaseAdmin
              .from("product_addons")
              .select("id")
              .eq("product_id", finalProductId)
              .eq("addon_type", addon.key)
              .maybeSingle();

            if (existingAddon) {
              await supabaseAdmin
                .from("product_addons")
                .update({ is_enabled: isEnabled })
                .eq("product_id", finalProductId)
                .eq("addon_type", addon.key);
            } else {
              await supabaseAdmin
                .from("product_addons")
                .insert({
                  product_id: finalProductId,
                  addon_type: addon.key,
                  is_enabled: isEnabled,
                  config: {},
                });
            }
          }
        }

        results.push({
          row: rowNum,
          status: isUpdate ? "updated" : "created",
          name: row.name,
        });
      } catch (err: any) {
        const errorMessage = err.message || "Unknown error";
        console.error(`Row ${rowNum} import error:`, errorMessage);
        
        // Provide more detailed error messages
        let detailedError = errorMessage;
        
        if (errorMessage.includes("invalid input syntax for type uuid")) {
          detailedError = "Invalid category ID or reference. Please check your category_path.";
        } else if (errorMessage.includes("duplicate key")) {
          detailedError = "Duplicate SKU. This product already exists.";
        } else if (errorMessage.includes("null value")) {
          detailedError = "Required field is missing. Check name, slug, and SKU.";
        } else if (errorMessage.includes("JSON")) {
          detailedError = "Invalid JSON format in one of the JSON fields (variants_json, specs_json, content_json, addons_json).";
        } else if (errorMessage.includes("network")) {
          detailedError = "Database connection error. Please try again.";
        }
        
        results.push({
          row: rowNum,
          status: "error",
          name: row.name || "Unnamed",
          error: detailedError,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "created" || r.status === "updated").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;
    const totalProducts = Object.keys(productGroups).length;

    return NextResponse.json({
      summary: {
        total: totalProducts,
        success: successCount,
        errors: errorCount,
        skipped: skippedCount,
      },
      results,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
