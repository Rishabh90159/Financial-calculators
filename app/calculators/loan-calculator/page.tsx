import Link from "next/link";
import { LoanCalculator } from "@/components/calculators/LoanCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Work out the EMI, total interest and true cost of a personal, car, education or business loan. Enter tenure in months or years and compare offers side by side.";

export const metadata = buildMetadata({
  title: "Loan Calculator – Personal Loan EMI, Interest & Total Cost",
  description: DESCRIPTION,
  path: "/calculators/loan-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "What is the difference between a flat rate and a reducing-balance rate?",
    answer:
      "A flat rate charges interest on the full original amount for the entire tenure, even as you repay. A reducing-balance rate charges interest only on what you still owe. At the same headline number, a flat-rate loan costs much more. This calculator uses the reducing-balance method.",
  },
  {
    question: "Can I use this calculator for a personal loan, car loan or education loan?",
    answer:
      "Yes, for any loan with a fixed interest rate and equal monthly instalments. For education loans with a moratorium period, interest that accrues during the moratorium is usually added to the principal, so enter the expected amount at the start of repayment.",
  },
  {
    question: "Does the calculator include processing fees?",
    answer:
      "No. Processing fees, documentation charges and loan insurance are separate costs. If a fee is deducted from the disbursed amount, you receive less but repay the full loan, which raises your effective cost.",
  },
  {
    question: "How do I compare two loan offers?",
    answer:
      "Run each offer with its exact amount, rate and tenure, then compare total interest and total repayment rather than just the EMI. Add each lender's fees to its total. The offer with the lowest total cost is cheaper, even if its EMI is higher.",
  },
  {
    question: "Should I take a longer tenure to reduce my EMI?",
    answer:
      "Only if the lower EMI is necessary for your budget. A longer tenure always increases total interest. A ₹5 lakh loan at 12% costs about ₹97,858 in interest over 3 years but about ₹1,67,333 over 5 years.",
  },
  {
    question: "Why does the interest share of my repayments matter?",
    answer:
      "It shows how much of every rupee you repay goes to the lender rather than reducing your debt. It is a quick way to compare loans of different sizes and tenures on the same footing.",
  },
];

export default function LoanCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="loan"
      h1="Loan Calculator"
      intro={
        <p>
          Find out what a personal, vehicle, education or business loan will really cost. Enter the amount, interest
          rate and tenure in months or years to see the EMI, total interest and how much of your repayments goes to
          interest.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<LoanCalculator />}
      faqs={FAQS}
    >
      <h2>The four numbers that define a loan</h2>
      <h3>Loan amount (principal)</h3>
      <p>
        The amount you borrow and must repay, excluding interest. If a processing fee is deducted upfront, you may receive
        less than this figure but still repay all of it.
      </p>
      <h3>Interest rate</h3>
      <p>
        The annual price of borrowing, expressed as a percentage. It may be <strong>fixed</strong> for the whole loan or{" "}
        <strong>floating</strong>, linked to a benchmark and changing over time. Personal loans usually carry higher
        rates than secured loans because there is no collateral.
      </p>
      <h3>Loan tenure</h3>
      <p>
        How long you take to repay. Personal loans typically run from a few months to several years; this calculator
        accepts tenure in either months or years. Tenure is the main lever for trading a lower EMI against higher total
        interest.
      </p>
      <h3>EMI</h3>
      <p>
        The fixed monthly instalment that results from the three numbers above. Each EMI covers that month&apos;s interest
        plus a slice of principal, calculated as:
      </p>
      <p className="formula">
        EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1]
      </p>
      <p>
        Here P is the principal, r the monthly rate (annual rate ÷ 1,200) and n the number of months. For a detailed
        walk-through of this formula, see the <Link href="/calculators/emi-calculator">EMI Calculator</Link>.
      </p>

      <h2>Example: a ₹5 lakh personal loan</h2>
      <p>Here is the same ₹5,00,000 loan with different rates and tenures:</p>
      <table>
        <caption className="sr-only">₹5 lakh loan at different rates and tenures</caption>
        <thead>
          <tr>
            <th scope="col">Rate · Tenure</th>
            <th scope="col" className="num">
              EMI
            </th>
            <th scope="col" className="num">
              Total interest
            </th>
            <th scope="col" className="num">
              Interest as % of loan
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>11% · 3 years</td>
            <td className="num">₹16,369</td>
            <td className="num">₹89,297</td>
            <td className="num">17.9%</td>
          </tr>
          <tr>
            <td>12% · 3 years</td>
            <td className="num">₹16,607</td>
            <td className="num">₹97,858</td>
            <td className="num">19.6%</td>
          </tr>
          <tr>
            <td>14% · 3 years</td>
            <td className="num">₹17,089</td>
            <td className="num">₹1,15,197</td>
            <td className="num">23.0%</td>
          </tr>
          <tr>
            <td>12% · 5 years</td>
            <td className="num">₹11,122</td>
            <td className="num">₹1,67,333</td>
            <td className="num">33.5%</td>
          </tr>
        </tbody>
      </table>
      <p>
        Three percentage points of rate (11% to 14%) adds about ₹26,000 of interest over three years. Two extra years
        of tenure at 12% adds almost ₹70,000, even though the EMI falls by about ₹5,500.
      </p>

      <h2>Watch out for flat-rate quotes</h2>
      <p>
        Some lenders and dealers quote a <strong>flat rate</strong>. At a 12% flat rate, the ₹5 lakh, 3-year loan would
        carry ₹1,80,000 of interest (12% × ₹5 lakh × 3 years). That is about 1.8 times the ₹97,858 charged at a 12%
        reducing-balance rate. Always ask which method a quoted rate uses, and compare the total repayment.
      </p>

      <h2>Ways to borrow more cheaply</h2>
      <ul>
        <li>
          <strong>Borrow only what you need.</strong> Every rupee borrowed carries interest for the whole tenure.
        </li>
        <li>
          <strong>Check your credit score first.</strong> A stronger credit history often qualifies for a lower rate.
        </li>
        <li>
          <strong>Choose the shortest affordable tenure</strong>, and prepay when you can if the lender&apos;s
          prepayment charges are low.
        </li>
        <li>
          <strong>Compare total cost across lenders</strong>, including processing fees and insurance, not the EMI alone.
        </li>
        <li>
          <strong>Consider a secured option</strong>, such as a loan against fixed deposits, which is often cheaper than
          an unsecured personal loan.
        </li>
      </ul>
      <p>
        Financing a car? The <Link href="/calculators/car-loan-calculator">Car Loan Calculator</Link> starts from the
        on-road price and compares tenures from three to seven years. Buying a home? Use the{" "}
        <Link href="/calculators/home-loan-calculator">Home Loan Calculator</Link>, which also works out down payment,
        loan-to-value and upfront cash.
      </p>
    </CalculatorPageLayout>
  );
}
