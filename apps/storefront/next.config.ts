import type { NextConfig } from "next";

const SUPABASE_HOSTNAME = "lgxqlgyciazmlllowhel.supabase.co";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    // Content Security Policy — restrict where scripts/styles/images can load from
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com", // unsafe-inline needed for Next.js inline scripts
      `connect-src 'self' http://localhost:8088 ws://localhost:8088 https://${SUPABASE_HOSTNAME} https://api.safaricom.co.ke https://sandbox.safaricom.co.ke https://firebaseapp.com wss://${SUPABASE_HOSTNAME} https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com`,
      `img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://${SUPABASE_HOSTNAME} https://images.samsung.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // ── Deployment optimization ───────────────────────────────────────────────
  output: "standalone",

  // ── Build quality gates — re-enabled for production safety ─────────────────
  // TypeScript and ESLint errors are NOW surfaced during builds.
  // Fix all type errors before deploying to production.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },


  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`,
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.samsung.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/product/:slug*",
        destination: "/products/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
