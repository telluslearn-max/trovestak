import { createBrowserClient } from "@supabase/ssr";

/**
 * CLIENT-SIDE SUPABASE CLIENT
 *
 * Use this ONLY in:
 * - Client Components ("use client")
 * - Browser event handlers
 *
 * For Server Components, Server Actions, or API Routes use:
 * - import { createSupabaseServerClient } from "@/lib/supabase-server"   (authenticated)
 * - import { createSupabaseAdminClient } from "@/lib/supabase-admin"     (service role)
 */

let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
    if (typeof window === "undefined") {
        // Prevent accidental server-side use of browser client
        throw new Error(
            "[supabase.ts] getSupabaseClient() was called on the server. " +
            "Use createSupabaseServerClient() from @/lib/supabase-server instead."
        );
    }

    if (!_browserClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            throw new Error("[supabase.ts] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        }

        _browserClient = createBrowserClient(url, key);
    }

    return _browserClient;
}

/**
 * Convenience export for Client Components.
 * Will throw an error if accidentally imported in a Server Component.
 */
export const supabase = typeof window !== "undefined" ? getSupabaseClient() : null as any;

// ─── Shared helpers (safe to use anywhere) ───────────────────────────────────

/** Format KES currency from cents — e.g. 150000 → "KES 1,500.00" */
export function formatKES(cents: number): string {
    const kes = cents / 100;
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2,
    }).format(kes);
}

/** Format price with "From" prefix for variable products */
export function formatPrice(fromCents?: number, toCents?: number): string {
    if (!fromCents) return "Price unavailable";
    if (toCents && toCents !== fromCents) return `From ${formatKES(fromCents)}`;
    return formatKES(fromCents);
}

/** Cloudinary URL transformation helper */
export function getCloudinaryUrl(
    publicId: string,
    options: { width?: number; height?: number; quality?: number } = {}
): string {
    const { width = 600, height, quality = 80 } = options;
    const transformations = [
        "f_auto",
        "q_auto",
        `w_${width}`,
        height ? `h_${height}` : "",
        "c_fit",
    ].filter(Boolean).join(",");

    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}
