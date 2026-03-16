import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /auth/callback
 *
 * Supabase OAuth callback — exchanges the code for a session, then redirects.
 * Used by Google OAuth (and any future provider) initiated from the checkout
 * page or login page.
 *
 * Query params:
 *   code     – OAuth authorisation code from Supabase
 *   redirect – path to send the user to after sign-in (default: "/")
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const redirect = searchParams.get("redirect") ?? "/";

    if (code) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL(redirect, origin));
}
