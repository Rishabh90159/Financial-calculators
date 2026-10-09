import Link from "next/link";
import { EmiCalculator } from "@/components/calculators/EmiCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Free loan EMI calculator: find the monthly EMI, total interest and repayment for any loan, with the reducing-balance formula and a full amortization schedule.";

export const metadata = buildMetadata({
  title: "EMI Calculator – Loan EMI, Interest & Amortization Schedule",
  description: DESCRIPTION,
  path: "/calculators/emi-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "What does EMI stand for?",
    answer:
      "EMI stands for Equated Monthly Instalment: a fixed amount you pay every month until the loan is repaid. Each EMI contains part interest and part principal, and the split changes every month even though the total stays the same.",
  },
  {
    question: "Why is most of my early EMI going to interest?",
    answer:
      "Interest is charged on the outstanding balance. At the start the balance is at its highest, so the interest portion is largest. As you repay principal, the balance and the interest on it fall, so a growing share of each EMI goes to principal.",
  },
  {
    question: "Does the EMI formula work for any type of loan?",
    answer:
      "It works for any loan with a fixed rate charged on a reducing balance and equal monthly payments. That includes most home, car, personal and education loans in India. It does not apply directly to flat-rate loans, interest-only loans, or loans with step-up or balloon payments.",
  },
  {
    question: "Will my bank's EMI exactly match this calculator?",
    answer:
      "It should be very close. Small differences come from how the lender rounds the EMI, interest for a broken first period before your EMI date, and processing fees or insurance added to the loan. If the gap is large, ask whether the quoted rate is a flat rate.",
  },
  {
    question: "Is it better to choose a lower EMI or a shorter tenure?",
    answer:
      "A shorter tenure means a higher EMI but much less total interest. A longer tenure lowers the EMI but increases total interest. Choose the shortest tenure whose EMI you can comfortably afford while keeping an emergency buffer.",
  },
  {
    question: "Can I change my EMI after taking the loan?",
    answer:
      "Often yes. Part-prepayments can be used to reduce either the EMI or the remaining tenure, and on floating-rate loans a rate change usually adjusts the tenure or the EMI. Policies and charges vary by lender, so check your loan agreement.",
  },
];

export default function EmiCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="emi"
      h1="EMI Calculator"
      intro={
        <p>
          Find the monthly instalment for any loan, plus how much of what you repay is interest. Enter the loan amount,
          annual interest rate and tenure. Results update instantly, with a full repayment schedule below.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<EmiCalculator />}
      faqs={FAQS}
    >
      <h2>How EMI is calculated</h2>
      <p>
        Almost every Indian lender uses the <strong>reducing-balance method</strong>: each month, interest is charged
        only on the principal still outstanding. The fixed instalment that repays the loan exactly over its tenure is:
      </p>
      <p className="formula">
        EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1]
      </p>
      <ul>
        <li>
          <strong>P</strong> is the principal, the amount you borrow.
        </li>
        <li>
          <strong>r</strong> is the <em>monthly</em> interest rate: the annual rate ÷ 12 ÷ 100. A 9% annual rate is
          0.0075 per month.
        </li>
        <li>
          <strong>n</strong> is the number of monthly instalments: tenure in years × 12.
        </li>
      </ul>
      <p>
        If the interest rate is zero, the formula simply becomes P ÷ n. This calculator handles that case too.
      </p>

      <h2>Example: EMI on a ₹10 lakh loan at 9% for 5 years</h2>
      <ol>
        <li>Monthly rate r = 9 ÷ 12 ÷ 100 = 0.0075</li>
        <li>Number of instalments n = 5 × 12 = 60</li>
        <li>(1 + r)<sup>n</sup> = 1.0075<sup>60</sup> ≈ 1.565681</li>
        <li>EMI = 10,00,000 × 0.0075 × 1.565681 ÷ 0.565681 ≈ <strong>₹20,758</strong></li>
      </ol>
      <table>
        <caption className="sr-only">Summary of the ₹10 lakh example</caption>
        <tbody>
          <tr>
            <th scope="row">Monthly EMI</th>
            <td className="num">₹20,758</td>
          </tr>
          <tr>
            <th scope="row">Total paid over 60 months</th>
            <td className="num">₹12,45,501</td>
          </tr>
          <tr>
            <th scope="row">Total interest</th>
            <td className="num">₹2,45,501</td>
          </tr>
        </tbody>
      </table>
      <p>
        In the very first month, interest is ₹10,00,000 × 0.0075 = ₹7,500, so only ₹13,258 of the EMI reduces your
        loan. By year five the picture reverses: of roughly ₹2.49 lakh paid that year, about ₹2.37 lakh is principal
        and only ₹11,730 is interest.
      </p>

      <h2>What affects your EMI</h2>
      <h3>Loan amount</h3>
      <p>
        EMI rises in direct proportion to the amount borrowed. Double the loan and the EMI doubles, as long as rate and
        tenure stay the same. Borrowing less, through a larger down payment, is the most direct way to reduce both EMI
        and total interest.
      </p>
      <h3>Interest rate</h3>
      <p>
        Small rate differences add up. In the example above, a rate of 10% instead of 9% raises the EMI by about ₹489 a
        month and total interest by roughly ₹29,300. On longer loans, the same one-point difference costs far more
        because interest compounds over many more months.
      </p>
      <h3>Tenure</h3>
      <p>
        A longer tenure spreads repayment out and lowers the EMI, but you pay interest for longer. Stretching the ₹10
        lakh loan from 5 to 7 years cuts the EMI to about ₹16,089 but raises total interest from ₹2.46 lakh to about ₹3.51
        lakh.
      </p>

      <h2>Reading your amortization schedule</h2>
      <p>
        The schedule under the calculator shows, for every year or month, how much of your payments went to principal,
        how much to interest, and what you still owe. Use it to see how quickly you build equity, how much is still
        outstanding if you plan to prepay or refinance, and when principal starts to dominate your payments.
      </p>

      <h2>Tips to keep your EMI and interest under control</h2>
      <ul>
        <li>
          <strong>Keep EMIs within your budget.</strong> Many lenders look for total EMIs to stay within roughly 40–50% of
          take-home income. A lower ratio leaves room for emergencies.
        </li>
        <li>
          <strong>Compare the rate type, not just the number.</strong> A &ldquo;flat&rdquo; rate charges interest on the
          original amount for the whole tenure and costs far more than the same reducing-balance rate.
        </li>
        <li>
          <strong>Prepay early if you can.</strong> Extra payments in the first years cut the balance when interest is
          highest, so they save the most.
        </li>
        <li>
          <strong>Look at total cost, not just EMI.</strong> Processing fees, insurance and prepayment charges all change
          what the loan really costs.
        </li>
      </ul>
      <p>
        Taking a home loan? The <Link href="/calculators/home-loan-emi-calculator">Home Loan EMI Calculator</Link> adds
        quick amount presets and home-loan-specific guidance. For other loans, the{" "}
        <Link href="/calculators/loan-calculator">Loan Calculator</Link> lets you enter tenure in months and shows interest
        as a share of the loan. To see how much an extra payment would save, try the{" "}
        <Link href="/calculators/loan-prepayment-calculator">Loan Prepayment Calculator</Link>.
      </p>
    </CalculatorPageLayout>
  );
}
