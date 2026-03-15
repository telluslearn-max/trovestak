/**
 * generate-embeddings.ts
 * Seeds pgvector embeddings for all published products.
 *
 * Uses text-embedding-004 (768-dim) — same model as search_products tool.
 * Requires the 20260315000000_add_embeddings.sql migration to be applied first.
 *
 * Run from apps/agent-service:
 *   cd apps/agent-service && npx tsx generate-embeddings.ts
 *
 * Options (env vars):
 *   BATCH_SIZE   — products per batch (default: 5)
 *   BATCH_DELAY  — ms between batches (default: 500)
 *   FORCE        — if "true", re-embeds products that already have embeddings
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_KEY   = process.env.GEMINI_API_KEY!;
// Free tier: 100 req/min. Process sequentially at 700ms/req = ~85 RPM
const REQ_DELAY    = parseInt(process.env.REQ_DELAY   || "700", 10);
const FORCE        = process.env.FORCE === "true";

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// gemini-embedding-001 via v1beta (text-embedding-004 unavailable on this key)
// outputDimensionality: 768 keeps vectors compatible with vector(768) column
async function getEmbedding(text: string): Promise<number[]> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text }] },
                outputDimensionality: 768,
            }),
        }
    );
    const json = await res.json() as any;
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json.embedding.values;
}

// ── Build embedding text ──────────────────────────────────────────────────────
function buildEmbedText(product: {
    name: string;
    brand?: string | null;
    nav_category?: string | null;
    short_description?: string | null;
}): string {
    const parts = [
        product.name,
        product.brand,
        product.nav_category,
        product.short_description,
    ];
    return parts.filter(Boolean).join(" | ");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log("Fetching products from Supabase...");

    let query = supabase
        .from("products")
        .select("id, name, brand, nav_category, short_description")
        .eq("status", "published");

    if (!FORCE) {
        query = query.is("embedding", null);
    }

    const { data: products, error } = await query;

    if (error) {
        if (error.message.includes("embedding")) {
            console.error("ERROR: 'embedding' column not found.");
            console.error("Run the migration first:\n  supabase/migrations/20260315000000_add_embeddings.sql");
            console.error("Paste it into the Supabase SQL editor: https://supabase.com/dashboard/project/lgxqlgyciazmlllowhel/sql");
        } else {
            console.error("Failed to fetch products:", error.message);
        }
        process.exit(1);
    }

    if (!products || products.length === 0) {
        console.log(FORCE
            ? "No published products found."
            : "All products already have embeddings. Use FORCE=true to re-embed.");
        return;
    }

    console.log(`Found ${products.length} product(s) to embed. Rate: 1 per ${REQ_DELAY}ms (~${Math.floor(60000/REQ_DELAY)} RPM)\n`);

    let success = 0;
    let failed  = 0;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        process.stdout.write(`[${i + 1}/${products.length}] "${product.name}" ... `);

        try {
            const text = buildEmbedText(product);
            const embedding = await getEmbedding(text);

            const { error: updateError } = await supabase
                .from("products")
                .update({ embedding })
                .eq("id", product.id);

            if (updateError) throw updateError;

            process.stdout.write("✓\n");
            success++;
        } catch (err: any) {
            process.stdout.write(`✗ ${err.message}\n`);
            failed++;
        }

        // Rate-limit: pause between requests (skip after last)
        if (i < products.length - 1) {
            await new Promise(r => setTimeout(r, REQ_DELAY));
        }
    }

    console.log(`\nDone. ✅ ${success} embedded, ❌ ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
