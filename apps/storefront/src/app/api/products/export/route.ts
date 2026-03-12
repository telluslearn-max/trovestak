import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleAssignment } = await supabase
    .from("user_role_assignments")
    .select("role:user_roles(name)")
    .eq("user_id", user.id)
    .single();

  const roleName = (roleAssignment?.role as any)?.name;
  if (!["super_admin", "manager", "editor"].includes(roleName)) return null;
  return user;
}

export async function GET(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .is("deleted_at", null)  // Only non-archived products
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: productCategories } = await supabaseAdmin
      .from("product_categories")
      .select("product_id, category_id, is_primary");

    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("slug, name");

    const categoryMap = new Map(categories?.map((c) => [c.slug, c.name]) || []);

    const getCategoryPath = (productId: string): string => {
      const pc = productCategories?.filter((p) => p.product_id === productId && p.is_primary);
      if (!pc || pc.length === 0) return "";
      return categoryMap.get(pc[0].category_id) || pc[0].category_id || "";
    };

    const rows = products?.map((p) => ({
      id: p.id,
      sku: p.sku || "",
      name: p.name || "",
      slug: p.slug || "",
      description: (p.description || "").replace(/,/g, ";"),
      product_type: p.product_type || "simple",
      regular_price: p.regular_price || "",
      sell_price: p.sell_price || "",
      // NOTE: cost_price intentionally omitted — editors should not see cost
      stock_quantity: p.stock_quantity ?? "",
      stock_status: p.stock_status || "instock",
      low_stock_threshold: p.low_stock_threshold ?? 5,
      allow_backorders: p.allow_backorders || "no",
      category_path: getCategoryPath(p.id),
      brand: p.brand || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      visibility: p.visibility || "catalog",
      is_featured: p.is_featured ? "TRUE" : "FALSE",
      status: p.status || "draft",
    }));

    const headers = [
      "id", "sku", "name", "slug", "description", "product_type",
      "regular_price", "sell_price", "stock_quantity", "stock_status",
      "low_stock_threshold", "allow_backorders", "category_path",
      "brand", "tags", "visibility", "is_featured", "status",
    ];

    const csvRows = [
      headers.join(","),
      ...(rows || []).map((r) =>
        headers.map((h) => {
          const val = r[h as keyof typeof r];
          if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(",")
      ),
    ];

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
