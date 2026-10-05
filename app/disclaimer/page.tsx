import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Disclaimer",
  description: `${siteConfig.name} calculators provide estimates for informational and educational purposes only and are not financial advice.`,
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <SimplePage title="Disclaimer" path="/disclaimer">
      <p>
        The calculators and content on {siteConfig.name} are provided for{" "}
        <strong>informational and educational purposes only</strong>. They are not financial, investment, tax, legal or
        lending advice, and they are not an offer or a recommendation to borrow, lend or invest.
      </p>
      <h2>Results are estimates</h2>
      <p>
        Every result is an estimate based on the inputs you provide and the assumptions stated on each page. Actual
        loan EMIs, interest rates, fees, charges, taxes, stamp duty and registration costs depend on your lender, your
        credit profile, your loan agreement, the applicable laws and the state you are in, and they may change over time.
        Floating interest rates can change during the life of a loan.
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
