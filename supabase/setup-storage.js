const SUPABASE_URL = "https://lgxqlgyciazmlllowhel.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M";

async function setupStorage() {
  console.log("Setting up storage bucket...");
  
  // Create media bucket
  const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      id: "media",
      name: "Media",
      public: true,
      file_size_limit: 10485760,
      allowed_mime_types: ["image/*"]
    }),
  });
  
  console.log("Bucket creation:", bucketRes.status, await bucketRes.text());
}

setupStorage();
