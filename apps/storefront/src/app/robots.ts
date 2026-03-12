import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/*", "/account/*", "/api/*", "/checkout", "/order-confirmation"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/*", "/account/*"],
      },
    ],
    sitemap: "https://trovestak.com/sitemap.xml",
    host: "https://trovestak.com",
  };
}
