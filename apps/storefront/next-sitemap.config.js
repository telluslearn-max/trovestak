/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://trovestak.com",
  generateRobotsTxt: false, // We'll handle this manually
  generateIndexSitemap: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/admin/*", "/account/*", "/checkout", "/order-confirmation"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/*", "/account/*", "/api/*"],
      },
    ],
  },
  additionalPaths: async (config) => {
    // Add dynamic product pages here
    return [
      {
        loc: "/store",
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      },
    ];
  },
};
