import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/format";
import { webPageJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";

/** Layout for plain informational pages (about, disclaimer, privacy, terms). */
export function SimplePage({
  title,
  path,
  description,
  children,
}: {
  title: string;
  path: string;
  /** Same text as the meta description; used in WebPage structured data. */
  description: string;
  children: ReactNode;
}) {
  return (
    <Container className="pt-6 sm:pt-8">
      <JsonLd data={webPageJsonLd({ name: title, description, path })} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: title, path },
        ]}
      />
      <h1 className="mt-5 text-[2rem] font-semibold sm:text-[2.6rem]">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Last updated <time dateTime={siteConfig.contentUpdated}>{formatDate(siteConfig.contentUpdated)}</time>
      </p>
      <div className="prose-fin mt-6">{children}</div>
    </Container>
  );
}
