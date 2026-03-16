import { createClient } from "@supabase/supabase-js";
/**
 * Standard Supabase client (anon role).
 */
export function createSupabaseClient(url, anonKey) {
    return createClient(url, anonKey);
}
/**
 * High-privilege Supabase client for administrative tasks.
 * Bypasses RLS. Use ONLY in server-side environments.
 */
export function createSupabaseAdminClient(url, serviceKey) {
    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
