import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductRow {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  regular_price?: number;
  sale_price?: number;
  sku?: string;
  stock_quantity?: number;
  manage_stock?: boolean;
  stock_status?: string;
  category_slug?: string;
  type?: string;
  status?: string;
  thumbnail_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { products, mode } = await req.json();

    if (!products || !Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: products array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ row: number; success: boolean; id?: string; error?: string }> = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i] as ProductRow;

      try {
        // Generate slug if not provided
        let slug = row.slug;
        if (!slug && row.name) {
          slug = row.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }

        // Find category by slug
        let categoryId = null;
        if (row.category_slug) {
          const { data: category } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", row.category_slug)
            .single();
          categoryId = category?.id;
        }

        const productData: Record<string, unknown> = {
          name: row.name,
          slug,
          description: row.description,
          short_description: row.short_description,
          regular_price: row.regular_price ? Math.round(row.regular_price * 100) : 0,
          sale_price: row.sale_price ? Math.round(row.sale_price * 100) : undefined,
          sku: row.sku,
          stock_quantity: row.stock_quantity,
          manage_stock: row.manage_stock ?? false,
          stock_status: row.stock_status || "instock",
          type: row.type || "simple",
          status: row.status || "draft",
          thumbnail_url: row.thumbnail_url,
          category_id: categoryId,
          is_active: true,
        };

        if (mode === "update" && row.sku) {
          // Update existing product by SKU
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("sku", row.sku)
            .single();

          if (existing) {
            const { error: updateError } = await supabase
              .from("products")
              .update(productData)
              .eq("id", existing.id);

            if (updateError) throw updateError;
            results.push({ row: i + 1, success: true, id: existing.id });
            continue;
          }
        }

        // Insert new product
        const { data: product, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (insertError) throw insertError;

        results.push({ row: i + 1, success: true, id: product?.id });
      } catch (err) {
        results.push({
          row: i + 1,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Imported ${successCount} products, ${failCount} failed`,
        results,
        summary: { success: successCount, failed: failCount },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
