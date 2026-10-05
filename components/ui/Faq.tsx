import type { FaqItem } from "@/lib/seo";

/** Native <details> disclosure: keyboard accessible and fully functional without JavaScript. */
export function Faq({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  return (
    <section aria-labelledby="faq-heading" className="faq">
      <h2 id="faq-heading" className="text-[1.4rem]">
        {heading}
      </h2>
      <div className="mt-3 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer items-start justify-between gap-4 py-3.5 font-semibold text-ink hover:text-brand sm:px-2">
              <h3 className="font-sans text-base leading-snug tracking-normal">{item.question}</h3>
              <span aria-hidden="true" className="chev mt-0.5 text-xl leading-none text-brand">
                +
              </span>
            </summary>
            <p className="pb-4 text-ink-muted sm:px-2">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
