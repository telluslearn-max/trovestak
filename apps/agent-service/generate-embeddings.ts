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
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_KEY   = process.env.GEMINI_API_KEY!;
const BATCH_SIZE   = parseInt(process.env.BATCH_SIZE  || "5", 10);
const BATCH_DELAY  = parseInt(process.env.BATCH_DELAY || "500", 10);
const FORCE        = process.env.FORCE === "true";

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const embedModel = new GoogleGenerativeAI(GEMINI_KEY)
    .getGenerativeModel({ model: "text-embedding-004" });

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

    console.log(`Found ${products.length} product(s) to embed. Batch: ${BATCH_SIZE}, Delay: ${BATCH_DELAY}ms\n`);

    let success = 0;
    let failed  = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch       = products.slice(i, i + BATCH_SIZE);
        const batchNum    = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(products.length / BATCH_SIZE);
        process.stdout.write(`Batch ${batchNum}/${totalBatches}: `);

        await Promise.all(batch.map(async (product) => {
            try {
                const text = buildEmbedText(product);
                const result = await embedModel.embedContent(text);
                const embedding = result.embedding.values;

                const { error: updateError } = await supabase
                    .from("products")
                    .update({ embedding })
                    .eq("id", product.id);

                if (updateError) throw updateError;

                process.stdout.write(".");
                success++;
            } catch (err: any) {
                process.stdout.write("✗");
                console.error(`\n  Failed [${product.id}] "${product.name}": ${err.message}`);
                failed++;
            }
        }));

        process.stdout.write(` (${Math.min(i + BATCH_SIZE, products.length)}/${products.length})\n`);

        if (i + BATCH_SIZE < products.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY));
        }
    }

    console.log(`\nDone. ✅ ${success} embedded, ❌ ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
