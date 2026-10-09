import Link from "next/link";
import { SipCalculator } from "@/components/calculators/SipCalculator";
import { CalculatorPageLayout, type Source } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Free SIP calculator for mutual fund SIP returns. Add a yearly step-up and inflation to see amount invested, estimated returns and value in today's money.";

export const metadata = buildMetadata({
  title: "SIP Calculator – SIP Return Calculator with Step-Up & Inflation",
  description: DESCRIPTION,
  path: "/calculators/sip-calculator",
});

const SOURCES: Source[] = [
  {
    name: "Ministry of Finance (Department of Economic Affairs) — inflation target notification, March 2026",
    detail:
      "CPI inflation target of 4% with a 2–6% tolerance band for April 2026 to March 2031; used only as a reference point for the inflation input",
  },
  {
    name: "SEBI — investor education on mutual funds",
    url: "https://investor.sebi.gov.in",
    detail: "mutual fund investments are subject to market risk; past performance does not indicate future returns",
  },
];

const FAQS: FaqItem[] = [
  {
    question: "What is the interest rate on a SIP?",
    answer:
      "A SIP has no interest rate. It is a way of buying mutual fund units every month, so its return depends on how the fund's investments perform, and that changes every year. The expected return in this calculator is an assumption you choose to illustrate compounding, not a rate any fund pays or promises.",
  },
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
    question: "How does the SIP calculator with inflation work?",
    answer:
      "Enter an expected inflation rate and the calculator divides the future value by (1 + inflation) raised to the number of years. The result is what that future amount could buy at today's prices. For example, ₹23.2 lakh in 10 years is worth about ₹13 lakh today if inflation averages 6% a year.",
  },
  {
    question: "What is a step-up SIP?",
    answer:
      "A step-up (or top-up) SIP raises the monthly instalment by a fixed percentage every year, for example in line with salary increases. A ₹10,000 SIP stepped up by 10% a year for 10 years could grow to about ₹33.7 lakh at an assumed 12%, against about ₹23.2 lakh without the step-up, partly because you also invest more: ₹19.1 lakh instead of ₹12 lakh.",
  },
  {
    question: "What is ₹1,000 a month in a SIP worth after 5 years?",
    answer:
      "You would invest ₹60,000. At an assumed 12% a year it could grow to about ₹82,486; at a lower return it would be less. This is an illustration, not a forecast, because actual mutual fund returns vary.",
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
          Estimate what a monthly mutual fund SIP could grow to. Enter how much you plan to invest each month, the return
          you expect and for how long. Optionally, add a yearly step-up and an inflation rate to see the result in
          today&apos;s money. The result is an <strong>estimate based on your assumptions</strong>, not a prediction.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<SipCalculator />}
      faqs={FAQS}
      sources={SOURCES}
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

      <h2>Small SIPs add up too</h2>
      <p>The same formula at an assumed 12% a year, for smaller amounts:</p>
      <table>
        <caption className="sr-only">Estimated value of smaller monthly SIPs at 12%</caption>
        <thead>
          <tr>
            <th scope="col">Monthly SIP · Duration</th>
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
            <td>₹1,000 · 5 years</td>
            <td className="num">₹60,000</td>
            <td className="num">₹82,486</td>
          </tr>
          <tr>
            <td>₹1,000 · 10 years</td>
            <td className="num">₹1,20,000</td>
            <td className="num">₹2,32,339</td>
          </tr>
          <tr>
            <td>₹5,000 · 10 years</td>
            <td className="num">₹6,00,000</td>
            <td className="num">₹11,61,695</td>
          </tr>
        </tbody>
      </table>

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

      <h2>Step-up SIP: increasing your SIP every year</h2>
      <p>
        With a step-up, the monthly instalment rises by a fixed percentage once a year. The calculator invests each
        year&apos;s higher instalment at the start of every month, compounds it at the same assumed return, and adds the
        years together. For ₹10,000 a month over 10 years at an assumed 12%:
      </p>
      <table>
        <caption className="sr-only">Effect of an annual step-up on a ₹10,000 SIP over 10 years at 12%</caption>
        <thead>
          <tr>
            <th scope="col">Annual step-up</th>
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
            <td>None</td>
            <td className="num">₹12,00,000</td>
            <td className="num">₹23,23,391</td>
          </tr>
          <tr>
            <td>5% a year</td>
            <td className="num">₹15,09,347</td>
            <td className="num">₹27,86,942</td>
          </tr>
          <tr>
            <td>10% a year</td>
            <td className="num">₹19,12,491</td>
            <td className="num">₹33,74,326</td>
          </tr>
        </tbody>
      </table>
      <p>
        Much of the extra value comes from the extra money you put in, so compare the invested column as well as the
        final value.
      </p>

      <h2>SIP calculator with inflation: value in today&apos;s money</h2>
      <p>
        A rupee in 20 years will buy less than a rupee today. To show the purchasing power of your future corpus, the
        calculator deflates it by the inflation rate you enter:
      </p>
      <p className="formula">
        Value in today&apos;s money = FV ÷ (1 + inflation)<sup>years</sup>
      </p>
      <p>
        ₹10,000 a month for 20 years at an assumed 12% gives an estimated ₹99,91,479. If inflation averages 6% a year,
        that is worth about <strong>₹31.2 lakh</strong> at today&apos;s prices; at 4%, about ₹45.6 lakh. The nominal
        figure does not change; only its purchasing power is shown. India&apos;s official CPI inflation target is 4%,
        within a 2–6% band, but actual inflation can be higher or lower, so try more than one rate when planning for a
        goal such as retirement or a child&apos;s education.
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
        Results here are before tax on gains. Inflation also reduces what the final amount can buy; use the optional
        inflation input to see the result in today&apos;s money.
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
        Not sure how much you can invest each month? The{" "}
        <Link href="/calculators/salary-calculator">in-hand salary calculator</Link> shows your take-home pay from your
        CTC. If you have a home loan, the <Link href="/calculators/loan-prepayment-calculator">loan prepayment
        calculator</Link> compares prepaying with investing the same money, and the{" "}
        <Link href="/calculators/rent-vs-buy-calculator">rent vs buy calculator</Link> shows how investing the difference
        affects the decision to buy a home.
      </p>
    </CalculatorPageLayout>
  );
}
