const SUPABASE_URL = "https://lgxqlgyciazmlllowhel.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M";

async function execSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL Error: ${text}`);
  }
  return response.json();
}

async function main() {
  console.log("Starting category creation...");
  
  try {
    // First, check existing categories
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug&limit=5`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const countHeader = checkRes.headers.get("content-range");
    console.log("Existing categories (range):", countHeader);
    
    // Insert Level 1 - Main Categories
    const level1Categories = [
      { name: "Mobile", slug: "mobile", description: "Mobile phones, tablets and accessories", is_active: true, position: 1, display_mode: "both", column_layout: "3-column" },
      { name: "Computing", slug: "computing", description: "Laptops, desktops, monitors and accessories", is_active: true, position: 2, display_mode: "both", column_layout: "3-column" },
      { name: "Audio", slug: "audio", description: "Headphones, speakers and professional audio", is_active: true, position: 3, display_mode: "both", column_layout: "3-column" },
      { name: "Gaming", slug: "gaming", description: "Consoles, PC gaming and accessories", is_active: true, position: 4, display_mode: "both", column_layout: "3-column" },
      { name: "Cameras", slug: "cameras", description: "Cameras, drones and accessories", is_active: true, position: 5, display_mode: "both", column_layout: "3-column" },
      { name: "Wearables", slug: "wearables", description: "Smartwatches, fitness trackers and smart glasses", is_active: true, position: 6, display_mode: "both", column_layout: "3-column" },
      { name: "Smart Home", slug: "smart-home", description: "Smart TVs, connectivity and streaming devices", is_active: true, position: 7, display_mode: "both", column_layout: "3-column" },
    ];

    console.log("\nInserting Level 1 categories...");
    const l1Res = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(level1Categories),
    });
    
    const l1Text = await l1Res.text();
    console.log("Level 1 response:", l1Res.status, l1Text.substring(0, 500));
    let l1Result = [];
    try { l1Result = JSON.parse(l1Text); } catch(e) {}
    
    // Get all categories to build parent map
    const allCatsRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug,parent_id&order=position`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const allCats = await allCatsRes.json();
    
    const slugToId = {};
    for (const cat of allCats) {
      slugToId[cat.slug] = cat.id;
    }
    
    console.log("Category slug map built:", Object.keys(slugToId).length);
    
    // Level 2 - Subcategories
    const level2Categories = [
      // Mobile (parent: mobile)
      { name: "Mobile Phones", slug: "mobile-phones", description: "All mobile phones", parent_id: slugToId["mobile"], is_active: true, position: 1, display_mode: "both" },
      { name: "Tablets", slug: "tablets", description: "iPads and Android tablets", parent_id: slugToId["mobile"], is_active: true, position: 2, display_mode: "both" },
      { name: "Mobile Accessories", slug: "mobile-accessories", description: "Cases, chargers and more", parent_id: slugToId["mobile"], is_active: true, position: 3, display_mode: "both" },
      // Computing (parent: computing)
      { name: "Laptops", slug: "laptops", description: "MacBooks, Windows and Chromebooks", parent_id: slugToId["computing"], is_active: true, position: 1, display_mode: "both" },
      { name: "Desktops & Monitors", slug: "desktops-monitors", description: "iMacs and gaming monitors", parent_id: slugToId["computing"], is_active: true, position: 2, display_mode: "both" },
      { name: "Computing Accessories", slug: "computing-accessories", description: "Power, UPS and peripherals", parent_id: slugToId["computing"], is_active: true, position: 3, display_mode: "both" },
      // Audio (parent: audio)
      { name: "Headphones", slug: "headphones", description: "Over-ear and wireless", parent_id: slugToId["audio"], is_active: true, position: 1, display_mode: "both" },
      { name: "Speakers", slug: "speakers", description: "Bluetooth and home audio", parent_id: slugToId["audio"], is_active: true, position: 2, display_mode: "both" },
      { name: "Professional Audio", slug: "professional-audio", description: "Studio and business audio", parent_id: slugToId["audio"], is_active: true, position: 3, display_mode: "both" },
      // Gaming (parent: gaming)
      { name: "Consoles", slug: "consoles", description: "PS5, Xbox and Nintendo", parent_id: slugToId["gaming"], is_active: true, position: 1, display_mode: "both" },
      { name: "PC Gaming", slug: "pc-gaming", description: "Gaming laptops and PCs", parent_id: slugToId["gaming"], is_active: true, position: 2, display_mode: "both" },
      { name: "Gaming Accessories", slug: "gaming-accessories", description: "Controllers and gear", parent_id: slugToId["gaming"], is_active: true, position: 3, display_mode: "both" },
      // Cameras (parent: cameras)
      { name: "Cameras", slug: "cameras-cat", description: "DSLR and mirrorless", parent_id: slugToId["cameras"], is_active: true, position: 1, display_mode: "both" },
      { name: "Drones & Gimbals", slug: "drones-gimbals", description: "DJI drones and gimbals", parent_id: slugToId["cameras"], is_active: true, position: 2, display_mode: "both" },
      { name: "Camera Accessories", slug: "camera-accessories", description: "Lenses and bags", parent_id: slugToId["cameras"], is_active: true, position: 3, display_mode: "both" },
      // Wearables (parent: wearables)
      { name: "Smartwatches", slug: "smartwatches", description: "Apple Watch and Galaxy Watch", parent_id: slugToId["wearables"], is_active: true, position: 1, display_mode: "both" },
      { name: "Fitness & Audio", slug: "fitness-audio", description: "Fitness trackers and earbuds", parent_id: slugToId["wearables"], is_active: true, position: 2, display_mode: "both" },
      { name: "Smart Glasses", slug: "smart-glasses", description: "Audio glasses and AR", parent_id: slugToId["wearables"], is_active: true, position: 3, display_mode: "both" },
      // Smart Home (parent: smart-home)
      { name: "Smart TVs", slug: "smart-tvs", description: "Samsung, LG and more", parent_id: slugToId["smart-home"], is_active: true, position: 1, display_mode: "both" },
      { name: "Connectivity", slug: "connectivity", description: "Starlink and routers", parent_id: slugToId["smart-home"], is_active: true, position: 2, display_mode: "both" },
      { name: "Streaming & Smart", slug: "streaming-smart", description: "Apple TV and smart lights", parent_id: slugToId["smart-home"], is_active: true, position: 3, display_mode: "both" },
    ];

    console.log("\nInserting Level 2 categories...");
    const l2Res = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(level2Categories),
    });
    
    const l2Result = await l2Res.json();
    console.log("Level 2 inserted:", l2Result.length || 0);
    
    // Refresh category map
    const allCatsRes2 = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug,parent_id&order=position`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const allCats2 = await allCatsRes2.json();
    
    for (const cat of allCats2) {
      slugToId[cat.slug] = cat.id;
    }
    
    // Level 3 - Sub-subcategories
    const level3Categories = [
      // Mobile Phones subcategories
      { name: "Flagship Phones", slug: "flagship-phones", description: "Premium smartphones", parent_id: slugToId["mobile-phones"], is_active: true, position: 1 },
      { name: "Mid-Range Phones", slug: "mid-range-phones", description: "Mid-tier smartphones", parent_id: slugToId["mobile-phones"], is_active: true, position: 2 },
      { name: "Budget Phones", slug: "budget-phones", description: "Affordable smartphones", parent_id: slugToId["mobile-phones"], is_active: true, position: 3 },
      // Tablets subcategories
      { name: "iPad", slug: "ipad", description: "Apple iPads", parent_id: slugToId["tablets"], is_active: true, position: 1 },
      { name: "Android Tablets", slug: "android-tablets", description: "Samsung and other Android tablets", parent_id: slugToId["tablets"], is_active: true, position: 2 },
      // Mobile Accessories subcategories
      { name: "Charging", slug: "mobile-charging", description: "Chargers and cables", parent_id: slugToId["mobile-accessories"], is_active: true, position: 1 },
      { name: "Cases & Protection", slug: "cases-protection", description: "Cases and screen protectors", parent_id: slugToId["mobile-accessories"], is_active: true, position: 2 },
      // Laptops subcategories
      { name: "MacBooks", slug: "macbooks", description: "Apple MacBooks", parent_id: slugToId["laptops"], is_active: true, position: 1 },
      { name: "Windows Laptops", slug: "windows-laptops", description: "Windows laptops", parent_id: slugToId["laptops"], is_active: true, position: 2 },
      { name: "Chromebooks", slug: "chromebooks", description: "Chrome OS laptops", parent_id: slugToId["laptops"], is_active: true, position: 3 },
      // Desktops & Monitors subcategories
      { name: "iMac", slug: "imac", description: "Apple iMac", parent_id: slugToId["desktops-monitors"], is_active: true, position: 1 },
      { name: "Gaming Monitors", slug: "gaming-monitors", description: "High refresh rate monitors", parent_id: slugToId["desktops-monitors"], is_active: true, position: 2 },
      { name: "4K Ultrawide", slug: "4k-ultrawide", description: "4K and ultrawide monitors", parent_id: slugToId["desktops-monitors"], is_active: true, position: 3 },
      // Computing Accessories subcategories
      { name: "Power & UPS", slug: "power-ups", description: "Power supplies and UPS", parent_id: slugToId["computing-accessories"], is_active: true, position: 1 },
      { name: "Peripherals", slug: "computing-peripherals", description: "Keyboards, mice and more", parent_id: slugToId["computing-accessories"], is_active: true, position: 2 },
      // Headphones subcategories
      { name: "Over-Ear", slug: "over-ear-headphones", description: "Over-ear headphones", parent_id: slugToId["headphones"], is_active: true, position: 1 },
      { name: "Wireless Earbuds", slug: "wireless-earbuds", description: "True wireless earbuds", parent_id: slugToId["headphones"], is_active: true, position: 2 },
      { name: "AirPods", slug: "airpods", description: "Apple AirPods", parent_id: slugToId["headphones"], is_active: true, position: 3 },
      // Speakers subcategories
      { name: "Bluetooth Speakers", slug: "bluetooth-speakers", description: "Portable Bluetooth speakers", parent_id: slugToId["speakers"], is_active: true, position: 1 },
      { name: "Home Audio", slug: "home-audio", description: "Home speaker systems", parent_id: slugToId["speakers"], is_active: true, position: 2 },
      { name: "Soundbars", slug: "soundbars", description: "TV soundbars", parent_id: slugToId["speakers"], is_active: true, position: 3 },
      // Professional Audio subcategories
      { name: "Studio Equipment", slug: "studio-equipment", description: "Studio monitors and mics", parent_id: slugToId["professional-audio"], is_active: true, position: 1 },
      { name: "Business Audio", slug: "business-audio", description: "Conference systems", parent_id: slugToId["professional-audio"], is_active: true, position: 2 },
      // Consoles subcategories
      { name: "PS5", slug: "ps5", description: "PlayStation 5", parent_id: slugToId["consoles"], is_active: true, position: 1 },
      { name: "Xbox Series", slug: "xbox-series", description: "Xbox Series X/S", parent_id: slugToId["consoles"], is_active: true, position: 2 },
      { name: "Nintendo Switch", slug: "nintendo-switch", description: "Nintendo Switch", parent_id: slugToId["consoles"], is_active: true, position: 3 },
      // PC Gaming subcategories
      { name: "Gaming Laptops", slug: "gaming-laptops", description: "High-performance gaming laptops", parent_id: slugToId["pc-gaming"], is_active: true, position: 1 },
      { name: "Gaming PCs", slug: "gaming-pcs", description: "Custom gaming desktops", parent_id: slugToId["pc-gaming"], is_active: true, position: 2 },
      { name: "Graphics Cards", slug: "graphics-cards", description: "GPUs and graphics cards", parent_id: slugToId["pc-gaming"], is_active: true, position: 3 },
      // Gaming Accessories subcategories
      { name: "Controllers", slug: "controllers", description: "Gaming controllers", parent_id: slugToId["gaming-accessories"], is_active: true, position: 1 },
      { name: "Gaming Gear", slug: "gaming-gear", description: "Headsets, keyboards and mice", parent_id: slugToId["gaming-accessories"], is_active: true, position: 2 },
      // Cameras subcategories
      { name: "DSLR", slug: "dslr-cameras", description: "Digital SLR cameras", parent_id: slugToId["cameras-cat"], is_active: true, position: 1 },
      { name: "Mirrorless", slug: "mirrorless-cameras", description: "Mirrorless cameras", parent_id: slugToId["cameras-cat"], is_active: true, position: 2 },
      { name: "Action Cameras", slug: "action-cameras", description: "GoPro and action cams", parent_id: slugToId["cameras-cat"], is_active: true, position: 3 },
      // Drones & Gimbals subcategories
      { name: "DJI Drones", slug: "dji-drones", description: "DJI drones", parent_id: slugToId["drones-gimbals"], is_active: true, position: 1 },
      { name: "Gimbals", slug: "gimbals", description: "Camera gimbals", parent_id: slugToId["drones-gimbals"], is_active: true, position: 2 },
      // Camera Accessories subcategories
      { name: "Lenses", slug: "camera-lenses", description: "Camera lenses", parent_id: slugToId["camera-accessories"], is_active: true, position: 1 },
      { name: "Storage & Bags", slug: "storage-bags", description: "Memory cards and bags", parent_id: slugToId["camera-accessories"], is_active: true, position: 2 },
      // Smartwatches subcategories
      { name: "Apple Watch", slug: "apple-watch", description: "Apple Watch", parent_id: slugToId["smartwatches"], is_active: true, position: 1 },
      { name: "Galaxy Watch", slug: "galaxy-watch", description: "Samsung Galaxy Watch", parent_id: slugToId["smartwatches"], is_active: true, position: 2 },
      { name: "Garmin", slug: "garmin-watches", description: "Garmin watches", parent_id: slugToId["smartwatches"], is_active: true, position: 3 },
      // Fitness & Audio subcategories
      { name: "Fitness Trackers", slug: "fitness-trackers", description: "Fitness bands", parent_id: slugToId["fitness-audio"], is_active: true, position: 1 },
      { name: "Wireless Earbuds", slug: "fitness-earbuds", description: "Sport earbuds", parent_id: slugToId["fitness-audio"], is_active: true, position: 2 },
      // Smart Glasses subcategories
      { name: "Audio Glasses", slug: "audio-glasses", description: "Audio glasses", parent_id: slugToId["smart-glasses"], is_active: true, position: 1 },
      { name: "AR Glasses", slug: "ar-glasses", description: "Augmented reality glasses", parent_id: slugToId["smart-glasses"], is_active: true, position: 2 },
      // Smart TVs subcategories
      { name: "Samsung QLED", slug: "samsung-qled", description: "Samsung QLED TVs", parent_id: slugToId["smart-tvs"], is_active: true, position: 1 },
      { name: "LG OLED", slug: "lg-oled", description: "LG OLED TVs", parent_id: slugToId["smart-tvs"], is_active: true, position: 2 },
      { name: "TCL Hisense", slug: "tcl-hisense", description: "TCL and Hisense TVs", parent_id: slugToId["smart-tvs"], is_active: true, position: 3 },
      // Connectivity subcategories
      { name: "Starlink", slug: "starlink", description: "Starlink internet", parent_id: slugToId["connectivity"], is_active: true, position: 1 },
      { name: "Mesh WiFi", slug: "mesh-wifi", description: "Mesh WiFi systems", parent_id: slugToId["connectivity"], is_active: true, position: 2 },
      { name: "WiFi 7 Routers", slug: "wifi7-routers", description: "WiFi 7 routers", parent_id: slugToId["connectivity"], is_active: true, position: 3 },
      // Streaming & Smart subcategories
      { name: "Apple TV", slug: "apple-tv-streaming", description: "Apple TV", parent_id: slugToId["streaming-smart"], is_active: true, position: 1 },
      { name: "Chromecast", slug: "chromecast", description: "Google Chromecast", parent_id: slugToId["streaming-smart"], is_active: true, position: 2 },
      { name: "Smart Lights", slug: "smart-lights", description: "Smart lighting", parent_id: slugToId["streaming-smart"], is_active: true, position: 3 },
    ];

    console.log("\nInserting Level 3 categories...");
    const l3Res = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(level3Categories),
    });
    
    const l3Result = await l3Res.json();
    console.log("Level 3 inserted:", l3Result.length || 0);
    
    // Final count
    const finalRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=count`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const finalData = await finalRes.json();
    console.log("\nTotal categories:", Array.isArray(finalData) ? finalData.length : "error");
    console.log("\nDone!");
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
