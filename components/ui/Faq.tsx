import type { FaqItem } from "@/lib/seo";

/** Native <details> disclosure: keyboard accessible and fully functional without JavaScript. */
export function Faq({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  return (
    <section aria-labelledby="faq-heading" className="faq">
      <h2 id="faq-heading" className="text-2xl sm:text-[1.625rem]">
        {heading}
      </h2>
      <div className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
        {items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-4 py-4 font-semibold text-ink hover:bg-paper sm:px-5">
              <h3 className="font-sans text-base leading-snug tracking-normal">{item.question}</h3>
              <span aria-hidden="true" className="chev mt-0.5 text-xl leading-none text-brand">
                +
              </span>
            </summary>
            <p className="px-4 pb-5 text-ink-muted sm:px-5">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
