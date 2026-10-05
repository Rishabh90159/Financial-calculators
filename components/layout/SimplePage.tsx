import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";

/** Layout for plain informational pages (about, disclaimer, privacy). */
export function SimplePage({ title, path, children }: { title: string; path: string; children: ReactNode }) {
  return (
    <Container className="pt-6 sm:pt-8">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: title, path },
        ]}
      />
      <h1 className="mt-5 text-[2rem] font-semibold sm:text-[2.6rem]">{title}</h1>
      <div className="prose-fin mt-6">{children}</div>
    </Container>
  );
}
