import type { Metadata } from "next";
import { calculatorPath, type CalculatorEntry } from "./calculators/registry";
import { absoluteUrl, siteConfig } from "./site";

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** Use the title verbatim instead of appending the site name via the template. */
  absoluteTitle?: boolean;
}

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} — ${siteConfig.tagline}` };

/**
 * Complete per-page metadata. Next.js shallow-merges openGraph/twitter objects,
 * so every page sets them in full rather than relying on the root layout.
 */
export function buildMetadata({ title, description, path, absoluteTitle }: PageMetaInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export interface FaqItem {
  question: string;
  /** Plain-text answer (also used verbatim in FAQPage JSON-LD). */
  answer: string;
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function calculatorAppJsonLd(entry: CalculatorEntry, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: entry.name,
    url: absoluteUrl(calculatorPath(entry)),
    description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript for interactive recalculation.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      contactPoint: { "@type": "ContactPoint", telephone: siteConfig.contact.phone, contactType: "customer support" },
    },
  };
}
