import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { calculatorPath, liveCalculators } from "@/lib/calculators/registry";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <Container className="py-20">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-ink-muted">That page does not exist. Try one of our calculators instead:</p>
      <ul className="mt-6 space-y-2">
        {liveCalculators().map((c) => (
          <li key={c.id}>
            <Link href={calculatorPath(c)} className="font-semibold text-brand underline underline-offset-4">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
