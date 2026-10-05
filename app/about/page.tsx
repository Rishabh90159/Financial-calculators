import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `What ${siteConfig.name} is, who its free financial calculators are for, and exactly how they work: formulas, assumptions, rounding, and what is and is not included.`;

export const metadata = buildMetadata({
  title: "About Us – Free, Transparent Financial Calculators",
  description: DESCRIPTION,
  path: "/about",
});

export default function AboutPage() {
  return (
    <SimplePage title="About & methodology" path="/about" description={DESCRIPTION}>
      <p>
        {siteConfig.name} is a free set of financial calculators for people in India who are thinking about a loan or an
        investment. Our aim is to show not only the answer but how it is reached, so you can check the numbers and
        understand the trade-offs before you commit to anything.
      </p>

      <h2>What problem we are trying to solve</h2>
      <p>
        Loan and investment decisions are often made from a single figure: an EMI on a bank&apos;s website or a projected
        return in a brochure. That figure rarely shows how much of your repayment is interest, how a small rate change
        adds up over 20 years, or how much cash a home purchase needs on day one. Our calculators put those numbers
        side by side and explain each one in plain language.
      </p>

      <h2>Who the calculators are for</h2>
      <ul>
        <li>Anyone comparing personal, car, education or business loan offers.</li>
        <li>
          Home buyers working out what they can afford, how much a lender may lend, the full cost of buying and whether
          buying beats renting on their own assumptions.
        </li>
        <li>Existing borrowers who want to see their amortization schedule, the effect of a rate reset or the saving from a
          prepayment.</li>
        <li>Salaried employees converting a CTC offer into expected monthly take-home pay.</li>
        <li>People planning a monthly SIP who want to understand how compounding and time affect the result.</li>
      </ul>
      <p>
        The calculators are planning and educational tools. They are not personalised financial advice, and{" "}
        {siteConfig.name} is not a lender, broker, bank or registered investment adviser.
      </p>

      <h2>Our principles</h2>
      <ul>
        <li>
          <strong>Transparent formulas.</strong> Every calculator page shows the formula it uses and a worked example
          you can check by hand.
        </li>
        <li>
          <strong>Tested calculations.</strong> Calculation logic is kept separate from the interface and covered by
          automated tests against reference values and edge cases. Results can never show invalid values such as
          negative EMIs.
        </li>
        <li>
          <strong>No guesswork presented as fact.</strong> Where a figure depends on local rules, such as state stamp
          duty, we ask you to enter it rather than assume a rate that might be outdated.
        </li>
        <li>
          <strong>No sign-up and no stored inputs.</strong> Calculations run in your browser. We do not ask for your
          name, phone number, email or income. See our <Link href="/privacy">privacy policy</Link>.
        </li>
      </ul>

      <h2 id="methodology">How the calculations work</h2>
      <p>
        Every calculator uses standard, published formulas: the reducing-balance EMI formula for loans, the
        present-value form of the same formula for eligibility and affordability, month-by-month simulation for
        prepayments and rent-versus-buy comparisons, and the current income tax slabs for the salary calculator. The
        formulas, assumptions, rounding rules and the few external references we use (such as RBI loan-to-value limits
        and income tax slabs) are documented in full on our <Link href="/methodology">methodology page</Link>.
      </p>

      <h2>Limitations</h2>
      <p>
        Results are estimates to help you plan and compare. Confirm final terms with your lender or product provider,
        and consider advice from a qualified professional for decisions that matter. Read our full{" "}
        <Link href="/disclaimer">disclaimer</Link> and <Link href="/terms">terms of use</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Found an error, or have a question or suggestion? See our <Link href="/contact">contact page</Link> or call us at{" "}
        <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>. Corrections to formulas or
        content are reviewed and published as soon as they are verified.
      </p>
    </SimplePage>
  );
}
