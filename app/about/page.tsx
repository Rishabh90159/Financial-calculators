import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { calculatorPath, getCalculator } from "@/lib/calculators/registry";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `What ${siteConfig.name} is, who its free financial calculators are for, and exactly how they work: formulas, assumptions, rounding, and what is and is not included.`;

export const metadata = buildMetadata({
  title: "About Us & Our Calculation Methodology",
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
        <li>Home buyers working out a down payment, loan amount and EMI before speaking to a lender.</li>
        <li>Existing borrowers who want to see their amortization schedule or the effect of a rate reset.</li>
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

      <h2 id="methodology">Methodology</h2>
      <h3>Loan EMI</h3>
      <p>
        The <Link href={calculatorPath(getCalculator("emi"))}>EMI Calculator</Link>,{" "}
        <Link href={calculatorPath(getCalculator("loan"))}>Loan Calculator</Link> and{" "}
        <Link href={calculatorPath(getCalculator("home-loan-emi"))}>Home Loan EMI Calculator</Link> use the
        reducing-balance method with monthly compounding: EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)
        <sup>n</sup> − 1], where P is the loan amount, r is the annual rate ÷ 12 ÷ 100, and n is the number of monthly
        instalments. When the rate is zero, the EMI is simply P ÷ n.
      </p>
      <p>
        Amortization schedules apply each month&apos;s interest to the outstanding balance, and the final instalment is
        adjusted so the balance ends at exactly zero.
      </p>
      <h3>SIP future value</h3>
      <p>
        The <Link href={calculatorPath(getCalculator("sip"))}>SIP Calculator</Link> treats each investment as made at
        the start of the month and compounds it at the expected annual return ÷ 12: FV = P × [(1 + i)<sup>n</sup> −
        1] ÷ i × (1 + i). The return is an assumption you choose, not a forecast.
      </p>
      <h3>Home loan</h3>
      <p>
        The <Link href={calculatorPath(getCalculator("home-loan"))}>Home Loan Calculator</Link> takes the loan amount as
        the property price minus the down payment, and the loan-to-value (LTV) ratio as the loan amount ÷ the property
        price. Total upfront cash is the down payment plus any stamp duty, registration and other costs you enter.
      </p>

      <h3>Assumptions</h3>
      <ul>
        <li>
          <strong>Interest rates are fixed for the whole tenure.</strong> Most Indian home loans are floating-rate, so
          your real rate, EMI or tenure can change after a reset.
        </li>
        <li>
          <strong>Payments are monthly and on time.</strong> The calculators do not model missed payments,
          part-prepayments or a broken first period before your first EMI date.
        </li>
        <li>
          <strong>Returns are constant.</strong> SIP projections assume the same return every month. Real market-linked
          returns vary and can be negative.
        </li>
        <li>
          <strong>Rates are entered by you.</strong> Default rates on each calculator are illustrative starting points,
          not current market rates or offers.
        </li>
      </ul>

      <h3>Taxes, fees and charges</h3>
      <p>
        Results exclude processing fees, insurance, GST, prepayment charges, capital-gains tax, exit loads and other
        costs unless a calculator asks you to enter them. Stamp duty and registration are included in the Home Loan
        Calculator only when you enter an amount. Fund expense ratios are already reflected in a fund&apos;s NAV, so a
        SIP return assumption should be net of those costs.
      </p>

      <h3>External references</h3>
      <p>
        The home loan LTV check uses the Reserve Bank of India&apos;s general loan-to-value slabs (90% up to ₹30 lakh,
        80% above ₹30 lakh up to ₹75 lakh, 75% above ₹75 lakh). It is informational only: lenders can apply stricter
        limits, and the rules can change. We do not use any other external data in the calculations.
      </p>

      <h3>Rounding</h3>
      <p>
        Calculations use full precision internally. Results are displayed rounded to the nearest rupee, with the exact
        EMI shown to the paisa. Lenders may round differently, so their figures can differ by a few rupees.
      </p>

      <h2>Limitations</h2>
      <p>
        Results are estimates to help you plan and compare. Confirm final terms with your lender or product provider,
        and consider advice from a qualified professional for decisions that matter. Read our full{" "}
        <Link href="/disclaimer">disclaimer</Link> and <Link href="/terms">terms of use</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Found an error, or have a question or suggestion? Call us at{" "}
        <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>. Corrections to formulas or
        content are reviewed and published as soon as they are verified.
      </p>
    </SimplePage>
  );
}
