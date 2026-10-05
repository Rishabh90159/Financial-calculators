import Link from "next/link";
import { SipCalculator } from "@/components/calculators/SipCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Estimate how much a monthly SIP could grow to. Enter your monthly investment, expected return and duration to see total invested, estimated returns and future value.";

export const metadata = buildMetadata({
  title: "SIP Calculator – Calculate SIP Returns & Future Value",
  description: DESCRIPTION,
  path: "/calculators/sip-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "What is a SIP?",
    answer:
      "A Systematic Investment Plan (SIP) is a way of investing a fixed amount at regular intervals, usually monthly, into a mutual fund. Each instalment buys units at that day's price, so you invest steadily regardless of whether markets are up or down.",
  },
  {
    question: "Are SIP returns guaranteed?",
    answer:
      "No. SIPs in equity or hybrid mutual funds are market-linked. Returns vary every year and can be negative over short periods. This calculator assumes a constant return to illustrate compounding; real portfolios will not grow in a straight line.",
  },
  {
    question: "What expected return should I use?",
    answer:
      "Use a conservative, long-term assumption for the type of fund you plan to invest in, and test a range rather than a single number. Comparing 8%, 10% and 12% shows how sensitive the outcome is. Past returns do not indicate future returns.",
  },
  {
    question: "Why does my fund statement show a different return?",
    answer:
      "Statements usually report XIRR, an annualised return that accounts for the exact date and amount of every instalment and the fund's actual day-to-day performance. This calculator projects a smooth, assumed return, so the two will rarely match exactly.",
  },
  {
    question: "Does this calculator include tax or fund expenses?",
    answer:
      "No. The result is before capital-gains tax, exit loads and other charges. Fund expense ratios are already reflected in a fund's NAV, so use a return assumption that is net of those costs.",
  },
  {
    question: "Is it better to invest a lump sum or through a SIP?",
    answer:
      "It depends on whether you already have the money and how comfortable you are with timing risk. A SIP suits investing from monthly income and spreads purchases across market levels. A lump sum is fully invested sooner. Neither is guaranteed to perform better.",
  },
];

export default function SipCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="sip"
      h1="SIP Calculator"
      intro={
        <p>
          See what a fixed monthly investment could grow to over time. Enter how much you plan to invest each month, the
          return you expect, and for how long. The result is an <strong>estimate based on your assumption</strong>, not a
          prediction.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<SipCalculator />}
      faqs={FAQS}
      investmentDisclaimer
    >
      <h2>How the SIP future value is calculated</h2>
      <p>
        The calculator treats a SIP as a series of equal monthly investments, each made at the start of the month and
        compounding monthly at your expected annual return ÷ 12. That is the convention most Indian mutual-fund SIP
        calculators use:
      </p>
      <p className="formula">
        FV = P × [(1 + i)<sup>n</sup> − 1] ÷ i × (1 + i)
      </p>
      <ul>
        <li>
          <strong>P</strong> is your monthly investment.
        </li>
        <li>
          <strong>i</strong> is the monthly rate of return: expected annual return ÷ 12 ÷ 100.
        </li>
        <li>
          <strong>n</strong> is the number of monthly instalments.
        </li>
      </ul>
      <p>
        <strong>Estimated returns</strong> are the future value minus everything you put in. They are what compounding
        has added on top of your own money.
      </p>

      <h2>Example: ₹10,000 a month for 10 years at 12%</h2>
      <ol>
        <li>Monthly rate i = 12 ÷ 12 ÷ 100 = 0.01; instalments n = 120</li>
        <li>(1.01<sup>120</sup> − 1) ÷ 0.01 ≈ 230.04</li>
        <li>FV ≈ 10,000 × 230.04 × 1.01 ≈ <strong>₹23,23,391</strong></li>
      </ol>
      <p>
        You invest ₹12,00,000 in total, and the estimated returns are about ₹11,23,391, nearly as much as you put in.
      </p>

      <h2>Why time matters more than you might expect</h2>
      <p>
        Compounding means returns themselves earn returns, so growth accelerates in later years. Using the same ₹10,000
        a month at an assumed 12%:
      </p>
      <table>
        <caption className="sr-only">Estimated SIP value by duration at 12%</caption>
        <thead>
          <tr>
            <th scope="col">Duration</th>
            <th scope="col" className="num">
              Invested
            </th>
            <th scope="col" className="num">
              Estimated value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>5 years</td>
            <td className="num">₹6,00,000</td>
            <td className="num">₹8,24,864</td>
          </tr>
          <tr>
            <td>10 years</td>
            <td className="num">₹12,00,000</td>
            <td className="num">₹23,23,391</td>
          </tr>
          <tr>
            <td>20 years</td>
            <td className="num">₹24,00,000</td>
            <td className="num">₹99,91,479</td>
          </tr>
        </tbody>
      </table>
      <p>
        Doubling the period from 10 to 20 years doubles what you invest but more than quadruples the estimated value. The
        assumed return matters too. At 10% instead of 12%, the 20-year figure falls to about ₹76.6 lakh. That gap is why
        it is worth testing several return assumptions.
      </p>

      <h2>What affects your SIP outcome</h2>
      <h3>Monthly amount</h3>
      <p>The future value scales directly with the instalment. Twice the SIP gives twice the estimated corpus.</p>
      <h3>Duration</h3>
      <p>
        The longer money stays invested, the more compounding works in your favour. Starting earlier often matters more
        than investing more later.
      </p>
      <h3>Rate of return</h3>
      <p>
        Real returns fluctuate. Equity funds can fall sharply in some years. A smooth assumed rate is useful for planning
        but hides that volatility, and the order of good and bad years affects your actual result.
      </p>
      <h3>Costs, taxes and inflation</h3>
      <p>
        Results here are before tax on gains. Inflation also reduces what the final amount can buy. ₹1 crore in 20 years
        will buy much less than ₹1 crore today.
      </p>

      <h2>Practical tips</h2>
      <ul>
        <li>
          <strong>Plan with a cautious return assumption</strong> and treat anything higher as a bonus.
        </li>
        <li>
          <strong>Increase your SIP as your income grows.</strong> Even a modest annual step-up can make a large
          difference over long periods.
        </li>
        <li>
          <strong>Match the fund to the goal&apos;s timeline.</strong> Money needed within a few years is generally not
          suited to volatile equity funds.
        </li>
        <li>
          <strong>Stay consistent.</strong> Stopping SIPs during market falls means missing purchases at lower prices.
        </li>
      </ul>
      <p>
        Planning a home purchase as well? See how investing compares with borrowing costs using the{" "}
        <Link href="/calculators/emi-calculator">EMI Calculator</Link>.
      </p>
    </CalculatorPageLayout>
  );
}
