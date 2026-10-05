/**
 * Single source of truth for brand and deployment settings.
 * Rename the product here; every page, metadata tag and JSON-LD block reads from it.
 */

/** Preferred public origin. Non-www and http variants 308-redirect here at the Vercel edge. */
const PRODUCTION_URL = "https://www.moneymetric.in";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Pin production to the www origin so canonicals never depend on which domain Vercel reports.
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_URL;
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "MoneyMetric",
  tagline: "Financial calculations made simple.",
  description:
    "Free financial calculators for EMI, home loans, eligibility, affordability, prepayment, rent vs buy, car loans, SIP and salary. Clear formulas and plain-language explanations.",
  url: resolveSiteUrl(),
  locale: "en_IN",
  contact: {
    /** E.164 format, used for tel: links and JSON-LD. */
    phone: "+919759790159",
    phoneDisplay: "+91 97597 90159",
  },
  /** ISO date of the last substantive content review. Used in the sitemap. */
  contentUpdated: "2026-10-06",
} as const;

/** Preview and development deployments must never be indexed. */
export const isIndexable =
  process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}
