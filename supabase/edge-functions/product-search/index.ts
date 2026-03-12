import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      query, 
      category_id,
      type,
      stock_status,
      min_price,
      max_price,
      page = 1,
      per_page = 20,
      sort_by = "relevance",
      sort_order = "desc",
    } = await req.json();

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: "Search query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the query
    let dbQuery = supabase
      .from("products")
      .select(`
        *,
        categories:product_categories(
          category:categories(id, name, slug)
        ),
        media:product_media(
          id, url, alt_text, is_primary, position
        )
      `, { count: "exact" })
      .eq("status", "published")
      .eq("is_active", true)
      .is("deleted_at", null);

    // Text search using ilike (simple) or full-text search
    const searchTerm = `%${query}%`;
    dbQuery = dbQuery.or(`name.ilike.${searchTerm},slug.ilike.${searchTerm},description.ilike.${searchTerm},short_description.ilike.${searchTerm},sku.ilike.${searchTerm}`);

    // Filters
    if (category_id) {
      dbQuery = dbQuery.eq("category_id", category_id);
    }
    if (type) {
      dbQuery = dbQuery.eq("type", type);
    }
    if (stock_status) {
      dbQuery = dbQuery.eq("stock_status", stock_status);
    }
    if (min_price !== undefined) {
      dbQuery = dbQuery.gte("regular_price", min_price * 100);
    }
    if (max_price !== undefined) {
      dbQuery = dbQuery.lte("regular_price", max_price * 100);
    }

    // Sorting
    const sortColumn = sort_by === "relevance" 
      ? "total_sales" 
      : sort_by === "price" 
        ? "regular_price" 
        : sort_by === "date" 
          ? "created_at" 
          : "name";
    
    dbQuery = dbQuery.order(sortColumn, { ascending: sort_order === "asc" });

    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    // Transform results
    const products = (data || []).map((product: Record<string, unknown>) => ({
      ...product,
      regular_price: (product.regular_price as number) / 100,
      sale_price: product.sale_price ? (product.sale_price as number) / 100 : null,
      min_price: product.min_price ? (product.min_price as number) / 100 : null,
      max_price: product.max_price ? (product.max_price as number) / 100 : null,
    }));

    return new Response(
      JSON.stringify({
        products,
        pagination: {
          page,
          per_page,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / per_page),
        },
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
