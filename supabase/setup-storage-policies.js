const SUPABASE_URL = "https://lgxqlgyciazmlllowhel.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M";

async function createStoragePolicy() {
  // Create policies using the correct endpoint
  const policies = [
    {
      name: "Allow public read",
      operation: "SELECT",
      definition: { "=": [true] }
    },
    {
      name: "Allow authenticated insert",
      operation: "INSERT", 
      definition: { "=": [{ "type": "role" }, "authenticated"] }
    },
    {
      name: "Allow authenticated update",
      operation: "UPDATE",
      definition: { "=": [{ "type": "role" }, "authenticated"] }
    },
    {
      name: "Allow authenticated delete",
      operation: "DELETE",
      definition: { "=": [{ "type": "role" }, "authenticated"] }
    }
  ];

  for (const policy of policies) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/media/policy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify(policy),
    });
    console.log(`${policy.name}:`, res.status, await res.text());
  }
}

createStoragePolicy();
