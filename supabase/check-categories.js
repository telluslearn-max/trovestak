const SUPABASE_URL = "https://lgxqlgyciazmlllowhel.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M";

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name,slug,parent_id&order=position`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  const categories = await res.json();
  console.log("Total categories:", categories.length);
  
  // Group by parent
  const roots = categories.filter(c => !c.parent_id);
  console.log("\nLevel 1 (roots):", roots.map(c => c.name).join(", "));
  
  const parentIds = new Set(roots.map(r => r.id));
  const level2 = categories.filter(c => c.parent_id && parentIds.has(c.parent_id));
  const level2Ids = new Set(level2.map(c => c.id));
  const level3 = categories.filter(c => c.parent_id && level2Ids.has(c.parent_id));
  
  console.log("\nLevel 2 count:", level2.length);
  console.log("Level 3 count:", level3.length);
  
  // Show level 2 with parent
  console.log("\nLevel 2 categories:");
  for (const cat of level2) {
    const parent = roots.find(r => r.id === cat.parent_id);
    console.log(`  - ${cat.name} (parent: ${parent?.name || 'unknown'})`);
  }
  
  console.log("\nLevel 3 categories:");
  for (const cat of level3.slice(0, 15)) {
    const parent = level2.find(l2 => l2.id === cat.parent_id);
    console.log(`  - ${cat.name} (parent: ${parent?.name || 'unknown'})`);
  }
}

main();
