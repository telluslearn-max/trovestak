import Script from "next/script";

interface ProductJsonLdProps {
  product: {
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    availability: "InStock" | "OutOfStock" | "PreOrder";
    brand?: string;
    sku?: string;
  };
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.image,
    description: product.description,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Trovestak",
    },
    offers: {
      "@type": "Offer",
      url: `https://trovestak.com/products/${product.id}`,
      priceCurrency: product.currency,
      price: (product.price / 100).toFixed(2),
      availability: `https://schema.org/${product.availability}`,
      seller: {
        "@type": "Organization",
        name: "Trovestak",
      },
    },
  };

  return (
    <Script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Trovestak",
    url: "https://trovestak.com",
    logo: "https://trovestak.com/logo.png",
    sameAs: [
      "https://facebook.com/trovestak",
      "https://twitter.com/trovestak",
      "https://instagram.com/trovestak",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254-XXX-XXXXXX",
      contactType: "customer service",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Trovestak",
    url: "https://trovestak.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://trovestak.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: "Trovestak",
    image: "https://trovestak.com/store.jpg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Nairobi, Kenya",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    priceRange: "KES",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "16:00",
      },
    ],
  };

  return (
    <Script
      id="localbusiness-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
