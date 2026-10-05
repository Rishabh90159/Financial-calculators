import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "About & Methodology",
  description: `How ${siteConfig.name}'s financial calculators work: the formulas we use, how we test accuracy, and the assumptions behind every result.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <SimplePage title="About & methodology" path="/about">
      <p>
        {siteConfig.name} builds simple, accurate financial calculators for people making real decisions about loans
        and investments. Our aim is to show not only the answer but how it is reached, so you can check it and
        understand the trade-offs.
      </p>

      <h2>Our principles</h2>
      <ul>
        <li>
          <strong>Transparent formulas.</strong> Every calculator page shows the formula it uses and a worked example.
        </li>
        <li>
          <strong>Tested calculations.</strong> Calculation logic is separate from the interface and covered by automated
          tests against published reference values and edge cases. Results can never show invalid values such as
          negative EMIs.
        </li>
        <li>
          <strong>No guesswork presented as fact.</strong> Where a figure depends on local rules, such as state stamp
          duty, we ask you to enter it rather than assume a rate that might be outdated.
        </li>
        <li>
          <strong>Privacy.</strong> Calculations run in your browser. See our <Link href="/privacy">privacy page</Link>.
        </li>
      </ul>

      <h2>Methodology</h2>
      <h3>Loan EMI</h3>
      <p>
        Loans use the reducing-balance method with monthly compounding: EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)
        <sup>n</sup> − 1], with r = annual rate ÷ 12 ÷ 100. Amortization schedules apply each month&apos;s interest to
        the outstanding balance, and the final instalment is adjusted so the balance ends at exactly zero.
      </p>
      <h3>SIP future value</h3>
      <p>
        SIPs are modelled as monthly investments made at the start of each month, compounding at the expected annual
        return ÷ 12: FV = P × [(1 + i)<sup>n</sup> − 1] ÷ i × (1 + i). Returns are assumptions, not forecasts.
      </p>
      <h3>Home loan</h3>
      <p>
        The loan amount is the property price minus the down payment. LTV is the loan amount ÷ the property price. The
        loan-to-value check uses RBI&apos;s general slabs and is informational only.
      </p>
      <h3>Rounding</h3>
      <p>
        Calculations use full precision internally. Results are displayed rounded to the nearest rupee, with the exact
        EMI shown to the paisa. Lenders may round differently.
      </p>

      <h2>Limitations</h2>
      <p>
        Results are estimates. They do not include fees, taxes, insurance, rate resets or broken-period interest unless
        stated. Read our full <Link href="/disclaimer">disclaimer</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, corrections or suggestions? Call us at{" "}
        <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>.
      </p>
    </SimplePage>
  );
}
