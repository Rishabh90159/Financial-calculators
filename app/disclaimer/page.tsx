import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `${siteConfig.name} calculators provide estimates for informational and educational purposes only. They are not financial, investment, tax or lending advice.`;

export const metadata = buildMetadata({
  title: "Disclaimer",
  description: DESCRIPTION,
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <SimplePage title="Disclaimer" path="/disclaimer" description={DESCRIPTION}>
      <p>
        The calculators and content on {siteConfig.name} are provided for{" "}
        <strong>informational and educational purposes only</strong>. They are not financial, investment, tax, legal or
        lending advice, and they are not an offer or a recommendation to borrow, lend or invest.
      </p>
      <h2>Who we are not</h2>
      <p>
        {siteConfig.name} is not a bank, lender, loan broker, mutual fund distributor or registered investment adviser.
        We do not arrange loans, sell financial products or receive information about your finances.
      </p>
      <h2>Results are estimates</h2>
      <p>
        Every result is an estimate based on the inputs you provide and the assumptions stated on each page. Actual
        loan EMIs, interest rates, fees, charges, taxes, stamp duty and registration costs depend on your lender, your
        credit profile, your loan agreement, the applicable laws and the state you are in, and they may change over time.
        Floating interest rates can change during the life of a loan. The assumptions behind each calculator are listed
        in our <Link href="/about#methodology">methodology</Link>.
      </p>
      <h2>Investment returns are not guaranteed</h2>
      <p>
        Investment projections, including SIP estimates, assume a constant rate of return that you choose. Real returns
        vary and can be negative. Mutual fund investments are subject to market risks. Past performance does not
        indicate future results.
      </p>
      <h2>No warranty</h2>
      <p>
        We work hard to keep calculations accurate and content up to date, but we make no warranty that results are
        complete, accurate or suitable for any particular purpose. Regulatory references, such as loan-to-value limits,
        are summaries and may not reflect the latest rules or an individual lender&apos;s policy.
      </p>
      <h2>Get professional advice</h2>
      <p>
        Before making a financial decision, confirm the terms with your lender or product provider and consider advice
        from a qualified, registered financial adviser or tax professional.
      </p>
    </SimplePage>
  );
}
