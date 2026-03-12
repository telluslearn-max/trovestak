/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * Usage:
 *   const limiter = rateLimit({ limit: 10, windowMs: 60_000 });
 *   const result = limiter.check(request, identifier);
 *   if (!result.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
 *
 * NOTE: This is a per-instance in-memory store — it resets on cold starts.
 * For multi-instance Cloud Run deployments, use Redis (Upstash) or Supabase rate-limit table.
 */

interface RateLimitOptions {
    /** Maximum number of requests per window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

interface RequestRecord {
    count: number;
    resetAt: number;
}

export function rateLimit({ limit, windowMs }: RateLimitOptions) {
    const store = new Map<string, RequestRecord>();

    // Prune stale entries every 5 minutes to avoid memory leak
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of store.entries()) {
            if (record.resetAt < now) store.delete(key);
        }
    }, 5 * 60 * 1000);

    function check(identifier: string): RateLimitResult {
        const now = Date.now();
        const record = store.get(identifier);

        if (!record || record.resetAt < now) {
            // Fresh window
            const resetAt = now + windowMs;
            store.set(identifier, { count: 1, resetAt });
            return { success: true, remaining: limit - 1, resetAt };
        }

        if (record.count >= limit) {
            return { success: false, remaining: 0, resetAt: record.resetAt };
        }

        record.count++;
        return { success: true, remaining: limit - record.count, resetAt: record.resetAt };
    }

    return { check };
}

/**
 * Extract the best available IP identifier from a Next.js request.
 * Uses X-Forwarded-For (Cloud Run / Vercel proxy) then falls back to direct IP.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return request.headers.get("x-real-ip") || "unknown";
}

// ─── Pre-configured limiters for common use cases ────────────────────────────

/** 30 requests per minute — for general authenticated API routes */
export const apiLimiter = rateLimit({ limit: 30, windowMs: 60_000 });

/** 5 requests per minute — for payment endpoints (M-Pesa STK Push) */
export const paymentLimiter = rateLimit({ limit: 5, windowMs: 60_000 });

/** 10 requests per minute — for file upload endpoint */
export const uploadLimiter = rateLimit({ limit: 10, windowMs: 60_000 });

/** 3 requests per minute — for discount code validation (prevent enumeration) */
export const discountLimiter = rateLimit({ limit: 3, windowMs: 60_000 });
