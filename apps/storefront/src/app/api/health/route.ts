/**
 * GET /api/health
 *
 * Liveness/readiness probe for Google Cloud Run.
 * Cloud Run uses this to detect unhealthy instances and route traffic away.
 *
 * Also checks Supabase connectivity for a deeper readiness check.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // Never cache health checks

export async function GET() {
    const start = Date.now();

    try {
        // Quick DB ping to verify Supabase connectivity
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.from("products").select("id").limit(1).single();
        const dbOk = !error || error.code === "PGRST116"; // PGRST116 = "no rows" — DB is reachable

        const latencyMs = Date.now() - start;

        if (!dbOk) {
            return NextResponse.json(
                { status: "degraded", db: "unreachable", latency_ms: latencyMs, ts: Date.now() },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: "ok",
            db: "ok",
            latency_ms: latencyMs,
            ts: Date.now(),
            version: process.env.npm_package_version || "dev",
        });
    } catch (err: any) {
        return NextResponse.json(
            { status: "error", error: err.message, latency_ms: Date.now() - start },
            { status: 500 }
        );
    }
}
