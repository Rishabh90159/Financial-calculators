import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-ink">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="underline-offset-4 hover:text-brand hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className="text-line-strong">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
