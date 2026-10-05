import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexable } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview/development deployments are blocked so they never compete with production.
  if (!isIndexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
