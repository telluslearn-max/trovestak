import { createClient } from "@supabase/supabase-js";

/**
 * High-privilege Supabase client for administrative tasks.
 * ONLY use this in Server Actions or Server Components.
 * Never expose this or its key to the client.
 */
export function createSupabaseAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error("Missing Supabase Admin environment variables");
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
