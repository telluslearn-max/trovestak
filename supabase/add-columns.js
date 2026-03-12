const SUPABASE_URL = "https://lgxqlgyciazmlllowhel.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M";

const columns = [
  { name: "cost_price", type: "integer" },
  { name: "regular_price", type: "integer" },
  { name: "sell_price", type: "integer" },
  { name: "sale_price_start", type: "timestamptz" },
  { name: "sale_price_end", type: "timestamptz" },
  { name: "product_type", type: "text", default: "'simple'" },
  { name: "stock_quantity", type: "integer" },
  { name: "stock_status", type: "text", default: "'instock'" },
  { name: "low_stock_threshold", type: "integer", default: "5" },
  { name: "allow_backorders", type: "text", default: "'no'" },
  { name: "brand", type: "text" },
  { name: "tags", type: "jsonb" },
  { name: "images", type: "jsonb" },
  { name: "is_featured", type: "boolean", default: "false" },
  { name: "visibility", type: "text", default: "'catalog'" },
  { name: "purchase_note", type: "text" },
  { name: "menu_order", type: "integer", default: "0" },
  { name: "attributes", type: "jsonb" },
  { name: "upsell_ids", type: "uuid[]" },
];

async function addColumns() {
  console.log("Adding columns to products table...\n");
  
  let success = 0;
  let failed = 0;

  for (const col of columns) {
    try {
      // Try to add column by inserting dummy data with the new column
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify([{ 
          name: "__temp_" + col.name,
          [col.name]: col.type === "boolean" ? false : col.type === "integer" ? 0 : null 
        }])
      });

      // If it fails with "column does not exist", we need another approach
      if (res.status === 400) {
        const error = await res.json();
        if (error.code === "42703") { // column does not exist
          console.log(`⚠️  ${col.name}: Needs manual setup (run migration SQL)`);
        } else {
          console.log(`✗  ${col.name}: ${error.message}`);
        }
        failed++;
      } else {
        console.log(`✓ ${col.name}: added successfully`);
        success++;
      }
    } catch (e) {
      console.log(`✗  ${col.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Added: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nNote: Run the SQL migration file if columns weren't added automatically.`);
}

addColumns();
