import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protected routes that require authentication
const AUTH_REQUIRED_PREFIXES = ["/account", "/orders", "/checkout", "/wishlist"];

// Redirect already-authed users away from auth pages
const AUTH_ONLY_PREFIXES = ["/sign-in", "/sign-up"];

// Admin routes — protected by admin layout but also checked here for fast redirect
const ADMIN_PREFIX = "/admin";

export async function updateSession(request: NextRequest) {
  console.log(`Middleware: Processing ${request.nextUrl.pathname}`);
  try {

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error("Middleware: Missing Supabase environment variables");
      return NextResponse.next();
    }

    let response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });

    // Temporarily bypass auth check for troubleshooting
    /*
    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // ── Redirect unauthenticated users away from protected routes ────────────
    const needsAuth = AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));
    if (needsAuth && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/sign-in";
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Redirect authenticated users away from sign-in/sign-up ──────────────
    const isAuthPage = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
    if (isAuthPage && user) {
      const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = returnTo;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    // ── Fast-path redirect for admin (layout does deep RBAC check) ───────────
    if (pathname.startsWith(ADMIN_PREFIX) && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    */


    return response;
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.next();
  }
}

export default async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match everything except static files and Next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
