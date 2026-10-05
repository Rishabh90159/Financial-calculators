/**
 * Single source of truth for brand and deployment settings.
 * Rename the product here; every page, metadata tag and JSON-LD block reads from it.
 */

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Vercel exposes the production domain at build time.
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "MoneyMetric",
  tagline: "Financial calculations made simple.",
  description:
    "Free, accurate financial calculators for EMI, SIP, personal loans and home loans. Clear formulas, amortization schedules and plain-language explanations.",
  url: resolveSiteUrl(),
  locale: "en_IN",
  contact: {
    /** E.164 format, used for tel: links and JSON-LD. */
    phone: "+919759790159",
    phoneDisplay: "+91 97597 90159",
  },
  /** ISO date of the last substantive content review. Used in the sitemap. */
  contentUpdated: "2026-10-05",
} as const;

/** Preview and development deployments must never be indexed. */
export const isIndexable =
  process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}
