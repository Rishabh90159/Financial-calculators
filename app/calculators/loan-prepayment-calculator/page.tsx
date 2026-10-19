import Link from "next/link";
import { LoanPrepaymentCalculator } from "@/components/calculators/LoanPrepaymentCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { calculateLoanPrepayment, type LoanPrepaymentInput } from "@/lib/calculations/loanPrepayment";
import { formatINR, formatMonths } from "@/lib/format";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "See how much interest a lump-sum prepayment or a yearly EMI increase saves on your home loan, compare reducing tenure vs EMI, and weigh prepaying vs investing.";

/** The page's running example: ₹30 lakh left at 8.5% with 15 years to go. */
const EXAMPLE: LoanPrepaymentInput = {
  outstanding: 30_00_000,
  annualRate: 8.5,
  remainingYears: 15,
  prepaymentAmount: 0,
  frequency: "once",
  firstPrepaymentMonth: 1,
};

/** Computed with the calculator's own engine at build time, so the article always matches the tool. */
const STEP_UPS = [3, 5, 7.5, 10].map((pct) => ({ pct, result: calculateLoanPrepayment({ ...EXAMPLE, emiStepUpPercent: pct }) }));
const STEP5 = calculateLoanPrepayment({ ...EXAMPLE, emiStepUpPercent: 5 });
const STEP5_WITH_LUMP = calculateLoanPrepayment({ ...EXAMPLE, prepaymentAmount: 2_00_000, emiStepUpPercent: 5 });
const BASE_EMI = STEP5.currentEmi;

export const metadata = buildMetadata({
  title: "Home Loan Prepayment Calculator – Reduce EMI or Tenure",
  description: DESCRIPTION,
  path: "/calculators/loan-prepayment-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "How much interest can I save by prepaying ₹2 lakh on my home loan?",
    answer:
      "On a ₹30 lakh balance at 8.5% with 15 years left, a ₹2 lakh prepayment with your next EMI saves about ₹4.56 lakh in interest if you keep the EMI and shorten the loan by 22 months. If you lower the EMI instead, the EMI falls from about ₹29,542 to ₹27,567 and you save about ₹1.54 lakh. The saving is larger when more years are left and the rate is higher.",
  },
  {
    question: "Should I reduce my EMI or my tenure after prepaying?",
    answer:
      "Reducing tenure almost always saves more interest, because you keep paying the higher EMI and the balance falls faster. Reducing EMI saves less but lowers your monthly outgo, which can help if your budget is tight or your income is uncertain. If you can comfortably afford the current EMI, reducing tenure is usually the better money-saving choice.",
  },
  {
    question: "Is there a penalty for prepaying a home loan?",
    answer:
      "Not on a floating-rate loan taken by an individual for a non-business purpose, such as a home loan. Under the RBI's Pre-payment Charges on Loans Directions, 2025, which apply to loans sanctioned or renewed on or after 1 January 2026, lenders cannot charge for part or full prepayment of such loans, with no minimum lock-in period, whatever the source of the money. Older loans were already covered by earlier RBI instructions. Fixed-rate loans can carry a charge under the lender's own policy, and any charge must be disclosed in the sanction letter and loan agreement.",
  },
  {
    question: "Can I increase my EMI instead of making a lump-sum prepayment?",
    answer: `Yes, many lenders let you raise your EMI on request, and the effect builds up quickly. On a ₹30 lakh balance at 8.5% with 15 years left, raising the EMI of ${formatINR(BASE_EMI)} by 5% at the start of each year closes the loan in ${formatMonths(STEP5.reduceTenure.months)} instead of 15 years and saves about ${formatINR(STEP5.reduceTenure.interestSaved)} in interest. A higher EMI is not a prepayment, so no prepayment charge applies. Check how your lender handles an EMI increase.`,
  },
  {
    question: "When is the best time to prepay a loan?",
    answer:
      "Earlier is better. In the early years most of each EMI goes towards interest, so every rupee of principal you clear stops a long stream of future interest. In the example on this page, ₹2 lakh prepaid now saves about ₹4.56 lakh, while the same amount prepaid in year 11 saves about ₹94,000.",
  },
  {
    question: "Is it better to prepay my loan or invest in a SIP?",
    answer:
      "Prepaying gives a guaranteed, tax-free return equal to your loan rate. An investment such as an equity SIP may earn more over long periods, but the return is uncertain and may be taxed. Compare your loan rate with the after-tax return you can realistically expect, keep an emergency fund first, and consider your tax deductions and how much risk you are comfortable with. Many people split surplus money between the two.",
  },
  {
    question: "Does prepayment affect my home loan tax deduction?",
    answer:
      "Under the old tax regime, prepaying principal reduces future interest, so the interest deduction you can claim also falls. Principal repayment may count towards the Section 80C deduction within its overall limit. Under the new tax regime these deductions are not available for a self-occupied home. Confirm your situation with a tax professional.",
  },
  {
    question: "Why does the calculator show an EMI different from mine?",
    answer:
      "The calculator works out the EMI that exactly repays your outstanding balance over the remaining tenure at your current rate. If your lender's EMI is different — for example because the rate changed and the tenure was adjusted — change the remaining tenure until the calculated EMI matches your actual EMI.",
  },
];

export default function LoanPrepaymentCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="loan-prepayment"
      h1="Loan Prepayment Calculator"
      intro={
        <p>
          See how much interest you save by paying extra towards your home loan or any other EMI-based loan. Enter your
          outstanding balance, rate and remaining tenure, add a one-time or yearly prepayment or a yearly EMI increase,
          and compare cutting your tenure with cutting your EMI.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<LoanPrepaymentCalculator />}
      faqs={FAQS}
      sources={[
        {
          name: "Reserve Bank of India — (Pre-payment Charges on Loans) Directions, 2025",
          url: "https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12878&Mode=0",
          detail:
            "RBI/2025-26/64, 2 July 2025. Applies to loans sanctioned or renewed on or after 1 January 2026. Checked 19 October 2026.",
        },
        {
          name: "Income Tax Department, Government of India",
          url: "https://www.incometax.gov.in",
          detail: "Deductions for home loan interest (Section 24(b)) and principal repayment (Section 80C) under the old tax regime.",
        },
      ]}
    >
      <h2>How prepayment saves interest</h2>
      <p>
        Interest on a home loan or personal loan is charged every month on the <strong>outstanding balance</strong>.
        When you prepay, the whole amount goes towards principal, so the balance drops immediately and every future
        month&apos;s interest is calculated on a smaller amount. You are not just saving interest on the prepaid sum for
        one month — you avoid interest on it for every month that would otherwise have been left on the loan.
      </p>
      <p>
        That is why the timing matters so much. In the early years of a long loan most of each EMI is interest, and the
        balance falls slowly. Prepaying then removes principal that would have been charged interest for many years.
      </p>

      <h2>Reduce EMI or reduce tenure?</h2>
      <p>When you prepay, many lenders let you choose what happens next:</p>
      <h3>Option A: Reduce tenure, keep the EMI</h3>
      <p>
        Your EMI stays the same and the loan simply ends earlier. Because you keep paying the full EMI on a smaller
        balance, more of each instalment goes to principal, and the balance falls faster month after month. This option
        saves the most interest.
      </p>
      <h3>Option B: Reduce EMI, keep the tenure</h3>
      <p>
        The lender recalculates your EMI on the reduced balance over the months still left. Your monthly outgo falls, but
        you keep paying for the original number of months, so the interest saving is smaller. This suits you if you
        want lower EMIs — for example, to free up cash for other goals or to build a buffer against a drop in income.
      </p>
      <p>
        If you are unsure, a middle path is to reduce tenure and keep a healthy emergency fund. You can always ask your
        lender later to reduce the EMI if your circumstances change, subject to their policy.
      </p>

      <h2>Increase your EMI every year instead</h2>
      <p>
        If you do not have a lump sum, raising your EMI a little each year, for example in line with your pay rise,
        can cut years off the loan. Every extra rupee in the EMI goes to principal, and the increases compound. Set
        &ldquo;Increase EMI every year&rdquo; in the calculator to see the effect on your own loan.
      </p>
      <p>
        On the ₹30 lakh balance at 8.5% with 15 years left, the EMI starts at {formatINR(BASE_EMI)} and rises at the
        start of each loan year. There is no lump sum:
      </p>
      <table>
        <caption className="sr-only">Effect of a yearly EMI increase on a ₹30 lakh loan at 8.5% with 15 years left</caption>
        <thead>
          <tr>
            <th scope="col">Yearly EMI increase</th>
            <th scope="col" className="num">
              Loan closes in
            </th>
            <th scope="col" className="num">
              EMI in the last year
            </th>
            <th scope="col" className="num">
              Interest saved
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>None</td>
            <td className="num">{formatMonths(STEP5.original.months)}</td>
            <td className="num">{formatINR(BASE_EMI)}</td>
            <td className="num">—</td>
          </tr>
          {STEP_UPS.map(({ pct, result }) => (
            <tr key={pct}>
              <td>{pct}% a year</td>
              <td className="num">{formatMonths(result.reduceTenure.months)}</td>
              <td className="num">{formatINR(result.reduceTenure.finalEmi)}</td>
              <td className="num">{formatINR(result.reduceTenure.interestSaved)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Combining the two works best. A ₹2 lakh prepayment now plus a 5% yearly EMI increase closes the loan in{" "}
        {formatMonths(STEP5_WITH_LUMP.reduceTenure.months)} and saves about{" "}
        {formatINR(STEP5_WITH_LUMP.reduceTenure.interestSaved)}. An EMI increase is not a prepayment, so no prepayment
        charge applies. Lenders handle it differently, so ask yours how to raise the EMI and whether it can be lowered
        again later.
      </p>

      <h2>How this calculator works</h2>
      <p>First it works out the EMI that repays your outstanding balance over the remaining tenure:</p>
      <p className="formula">
        EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1]
      </p>
      <p>
        P is the outstanding principal, r is the monthly rate (annual rate ÷ 12 ÷ 100) and n is the number of months
        left. It then simulates the loan month by month, twice — once without prepayment and once with it:
      </p>
      <ul>
        <li>
          If you set a yearly EMI increase, the EMI is multiplied by (1 + increase) in months 13, 25, 37 and so on. The
          &ldquo;without prepayment&rdquo; run always keeps today&apos;s EMI.
        </li>
        <li>Interest for the month = balance × r.</li>
        <li>Principal repaid = EMI − interest. The final EMI is trimmed so the balance ends at exactly zero.</li>
        <li>Any extra monthly payment is then taken off the balance.</li>
        <li>
          In a prepayment month (and on every anniversary of it, if you choose &ldquo;Every year&rdquo;), the lump sum is
          taken off the balance. A prepayment larger than the balance simply closes the loan.
        </li>
        <li>
          <strong>Reduce tenure:</strong> the EMI changes only through a yearly increase you set.{" "}
          <strong>Reduce EMI:</strong> after each lump sum, the
          EMI is recalculated on the new balance over the months left in the original tenure. Extra monthly payments
          never change the EMI; they always shorten the loan.
        </li>
      </ul>
      <p>
        Interest saved = total interest without prepayment − total interest with prepayment. If you enter a prepayment
        fee, it is charged on each amount prepaid and paid separately, and the net saving is interest saved minus fees.
      </p>

      <h2>Worked example: ₹2 lakh prepaid on a ₹30 lakh home loan</h2>
      <p>
        You owe ₹30,00,000 at 8.5% with 15 years (180 EMIs) left, and you prepay ₹2,00,000 along with your next EMI.
      </p>
      <ul>
        <li>Current EMI ≈ ₹29,542. Without prepayment, total interest over the remaining 15 years ≈ ₹23,17,594.</li>
        <li>
          Month 1: interest = ₹30,00,000 × 8.5% ÷ 12 = ₹21,250, so ₹8,292 of the EMI repays principal. After the ₹2
          lakh prepayment the balance is ≈ ₹27,91,708.
        </li>
      </ul>
      <table>
        <caption className="sr-only">Effect of a ₹2 lakh prepayment on a ₹30 lakh loan at 8.5% with 15 years left</caption>
        <thead>
          <tr>
            <th scope="col">Option</th>
            <th scope="col" className="num">
              EMI
            </th>
            <th scope="col" className="num">
              Loan ends after
            </th>
            <th scope="col" className="num">
              Total interest
            </th>
            <th scope="col" className="num">
              Interest saved
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>No prepayment</td>
            <td className="num">₹29,542</td>
            <td className="num">15 years</td>
            <td className="num">₹23,17,594</td>
            <td className="num">—</td>
          </tr>
          <tr>
            <td>Reduce tenure</td>
            <td className="num">₹29,542</td>
            <td className="num">13 years 2 months</td>
            <td className="num">₹18,61,766</td>
            <td className="num">₹4,55,828</td>
          </tr>
          <tr>
            <td>Reduce EMI</td>
            <td className="num">₹27,567</td>
            <td className="num">15 years</td>
            <td className="num">₹21,64,080</td>
            <td className="num">₹1,53,514</td>
          </tr>
        </tbody>
      </table>
      <p>
        Keeping the EMI cuts 22 months off the loan and saves about three times as much interest as lowering the EMI.
        Lowering the EMI, on the other hand, frees up about ₹1,975 a month for the rest of the loan. If you repeat the ₹2
        lakh prepayment every year and keep the EMI, the loan closes in about 7 years 1 month and saves about ₹13.6 lakh
        in interest.
      </p>

      <h3>Savings at different prepayment amounts</h3>
      <p>Same loan, one prepayment with the next EMI:</p>
      <table>
        <caption className="sr-only">Interest saved by prepayment amount on a ₹30 lakh loan at 8.5% with 15 years left</caption>
        <thead>
          <tr>
            <th scope="col">Prepayment</th>
            <th scope="col" className="num">
              Interest saved (reduce tenure)
            </th>
            <th scope="col" className="num">
              Time saved
            </th>
            <th scope="col" className="num">
              New EMI (reduce EMI)
            </th>
            <th scope="col" className="num">
              Interest saved (reduce EMI)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>₹50,000</td>
            <td className="num">₹1,23,834</td>
            <td className="num">5 months</td>
            <td className="num">₹29,048</td>
            <td className="num">₹38,378</td>
          </tr>
          <tr>
            <td>₹1,00,000</td>
            <td className="num">₹2,40,729</td>
            <td className="num">11 months</td>
            <td className="num">₹28,555</td>
            <td className="num">₹76,757</td>
          </tr>
          <tr>
            <td>₹2,00,000</td>
            <td className="num">₹4,55,828</td>
            <td className="num">1 year 10 months</td>
            <td className="num">₹27,567</td>
            <td className="num">₹1,53,514</td>
          </tr>
          <tr>
            <td>₹5,00,000</td>
            <td className="num">₹9,79,718</td>
            <td className="num">4 years 2 months</td>
            <td className="num">₹24,605</td>
            <td className="num">₹3,83,785</td>
          </tr>
        </tbody>
      </table>

      <h2>When prepayment helps most</h2>
      <p>
        The same ₹2 lakh prepayment on the loan above saves very different amounts depending on when you make it, if you
        keep the EMI:
      </p>
      <ul>
        <li>
          <strong>Now (month 1):</strong> about ₹4,55,828 saved, 22 months shorter.
        </li>
        <li>
          <strong>After 5 years (month 61):</strong> about ₹2,40,827 saved, 14 months shorter.
        </li>
        <li>
          <strong>After 10 years (month 121):</strong> about ₹93,820 saved, 9 months shorter.
        </li>
      </ul>
      <p>Prepayment tends to make the most sense when:</p>
      <ul>
        <li>many years are left on the loan, so most of each EMI is still interest;</li>
        <li>your loan rate is high compared with what you can safely earn elsewhere;</li>
        <li>you already have an emergency fund and adequate insurance;</li>
        <li>you get little or no tax benefit from the interest you pay;</li>
        <li>there is no prepayment fee, or the fee is small compared with the interest saved.</li>
      </ul>
      <p>
        To see how your balance splits between principal and interest year by year, use the{" "}
        <Link href="/calculators/home-loan-emi-calculator">home loan EMI calculator with amortization schedule</Link>.
        For car, personal or education loans, the <Link href="/calculators/emi-calculator">EMI calculator</Link> shows
        the same breakdown.
      </p>

      <h2>Prepayment charges and RBI rules</h2>
      <p>
        The RBI&apos;s <strong>Pre-payment Charges on Loans Directions, 2025</strong> (2 July 2025) apply to floating-rate
        loans sanctioned or renewed on or after <strong>1 January 2026</strong>. Under them:
      </p>
      <ul>
        <li>
          <strong>Home loans and other non-business loans to individuals:</strong> no lender may charge for a part or
          full prepayment.
        </li>
        <li>
          <strong>Business loans to individuals and micro and small enterprises:</strong> commercial banks (other than
          small finance, regional rural and local area banks), Tier 4 urban co-operative banks, upper-layer NBFCs and
          all-India financial institutions may not charge at all. Small finance banks, regional rural banks, Tier 3
          urban co-operative banks, state and central co-operative banks and middle-layer NBFCs may not charge on loans
          of up to ₹50 lakh.
        </li>
        <li>
          This applies whatever the source of the money and without any minimum lock-in period. Any charge that does
          apply must be stated in the sanction letter and loan agreement.
        </li>
      </ul>
      <p>
        Floating-rate home loans to individuals taken before 2026 were already protected by earlier RBI instructions.
        In practice, most individuals with a floating-rate home loan can prepay without a penalty.
      </p>
      <p>
        <strong>Fixed-rate loans</strong> are outside these rules, so the lender&apos;s own policy applies, and a charge
        of a percentage of the amount prepaid is common. Check your loan agreement before you pay, and enter any fee in
        the calculator to see your net saving.
      </p>

      <h2>Is prepaying better than investing?</h2>
      <p>
        Prepaying a loan is like earning a <strong>guaranteed return equal to your loan rate</strong>: every rupee you
        prepay stops being charged that interest. There is no market risk and no tax on this &ldquo;return&rdquo;.
        Investing the same money — for example through a SIP in mutual funds — may earn more over long periods, but the
        return is <strong>not guaranteed</strong>, can be negative for years at a time, and may be taxed when you
        withdraw.
      </p>
      <p>
        To compare the two fairly, look at what the same lump sum is worth at the end of the same period. In the example
        above, ₹2,00,000 prepaid with the next EMI avoids 8.5% interest (compounded monthly, about 8.84% a year
        effective) for the remaining 179 months. That is worth the same as ₹2,00,000 growing to about ₹7,07,519. Invested
        at an assumed 10% a year for the same period, it would grow to about ₹8,28,840 before tax. If tax took 12.5% of
        the gain, the after-tax value would be about ₹7,50,235, and the investment would need to earn about 9.55% a year
        just to match prepaying.
      </p>
      <p>A few more points to weigh:</p>
      <ul>
        <li>
          <strong>Tax deductions change the effective loan rate.</strong> If you claim home loan interest under the old
          tax regime, your after-tax borrowing cost is lower than the headline rate, which makes prepaying less
          attractive.
        </li>
        <li>
          <strong>Liquidity.</strong> Money prepaid into a loan is hard to get back. Money invested can usually be
          withdrawn, though possibly at a loss.
        </li>
        <li>
          <strong>Emergency fund first.</strong> Keep several months of expenses accessible before prepaying.
        </li>
        <li>
          <strong>Floating rates move.</strong> If your loan rate rises, the guaranteed return from prepaying rises too.
        </li>
      </ul>
      <p>
        The calculator&apos;s &ldquo;Prepay or invest&rdquo; section runs this comparison with your own figures. To
        estimate how regular monthly investments might grow instead, try the{" "}
        <Link href="/calculators/sip-calculator">SIP calculator</Link>. This is an illustration, not personalised advice.
      </p>

      <h2>Tax considerations</h2>
      <p>
        Under the old tax regime, interest on a home loan for a self-occupied house can be deducted under Section 24(b),
        and principal repayment can count towards Section 80C, both subject to limits and conditions. Prepaying reduces
        the interest you pay in future years, so it also reduces the interest deduction you can claim. If your annual
        interest is already above the deduction limit, prepaying may not reduce your tax benefit at all in the near
        term. The new tax regime does not allow these deductions for a self-occupied home. Tax rules change, so confirm
        the current position with a tax professional.
      </p>

      <h2>Important assumptions</h2>
      <ul>
        <li>The interest rate stays the same for the rest of the loan. Floating rates can change.</li>
        <li>Prepayments are credited with the EMI of the chosen month and reduce principal straight away.</li>
        <li>The calculated EMI repays your balance exactly over the remaining tenure; your lender&apos;s figures may differ slightly due to rounding and the date interest is charged.</li>
        <li>Processing charges, insurance and tax benefits are not included.</li>
      </ul>
      <p>
        Planning a new purchase rather than an existing loan? The{" "}
        <Link href="/calculators/home-loan-calculator">home loan calculator</Link> works out your loan amount, EMI and
        upfront cash from the property price and down payment.
      </p>
    </CalculatorPageLayout>
  );
}
