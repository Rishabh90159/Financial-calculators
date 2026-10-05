import type { MetadataRoute } from "next";
import { calculatorPath, liveCalculators } from "@/lib/calculators/registry";
import { absoluteUrl, siteConfig } from "@/lib/site";

/** Only live calculators are listed; planned ones appear automatically once launched. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(siteConfig.contentUpdated);

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/calculators"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...liveCalculators().map((c) => ({
      url: absoluteUrl(calculatorPath(c)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/disclaimer"), lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
