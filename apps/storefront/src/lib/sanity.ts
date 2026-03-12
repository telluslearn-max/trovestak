import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

// Seasonal content queries
export async function getSeasonalContent() {
  const query = `*[_type == "seasonalContent" && active == true] | order(startDate desc)[0]`;
  return client.fetch(query);
}

export async function getHomepageHero() {
  const query = `*[_type == "hero" && active == true] | order(_updatedAt desc)[0]`;
  return client.fetch(query);
}

export async function getFeaturedCollections() {
  const query = `*[_type == "featuredCollection" && active == true] | order(order asc)`;
  return client.fetch(query);
}

export async function getPromotionalBanner() {
  const query = `*[_type == "promotionalBanner" && active == true && startDate <= now() && endDate >= now()] | order(_updatedAt desc)[0]`;
  return client.fetch(query);
}

// Types
export interface HeroContent {
  _id: string;
  title: string;
  subtitle?: string;
  backgroundImage?: any;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  active: boolean;
}

export interface FeaturedCollection {
  _id: string;
  title: string;
  description?: string;
  image?: any;
  link: string;
  order: number;
  active: boolean;
}

export interface PromotionalBanner {
  _id: string;
  message: string;
  backgroundColor?: string;
  textColor?: string;
  link?: string;
  startDate: string;
  endDate: string;
  active: boolean;
}
