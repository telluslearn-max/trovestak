
const url = "https://lgxqlgyciazmlllowhel.supabase.co/rest/v1/products?select=count";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M";

async function test() {
  console.log("Testing Supabase connection with SERVICE ROLE KEY...");
  try {
    const response = await fetch(url, {
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`
      }
    });
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

test();
