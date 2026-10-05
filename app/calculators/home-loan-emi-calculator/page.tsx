import Link from "next/link";
import { HomeLoanEmiCalculator } from "@/components/calculators/HomeLoanEmiCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Calculate your home loan EMI, total interest and repayment schedule. Try ₹25 lakh to ₹1 crore loans and see how interest rate and tenure change what you pay.";

export const metadata = buildMetadata({
  title: "Home Loan EMI Calculator – EMI, Interest & Amortization",
  description: DESCRIPTION,
  path: "/calculators/home-loan-emi-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "What is the EMI for a ₹50 lakh home loan?",
    answer:
      "At 8.5% for 20 years, the EMI on a ₹50 lakh home loan is about ₹43,391 a month, with total interest of about ₹54.1 lakh. At 30 years the EMI drops to about ₹38,446, but total interest rises to about ₹88.4 lakh. Your EMI depends on the rate you are offered.",
  },
  {
    question: "How much does a 0.25% rate change affect my home loan EMI?",
    answer:
      "On a ₹50 lakh, 20-year loan, moving from 8.5% to 8.75% raises the EMI by about ₹795 a month and total interest by about ₹1.9 lakh. The effect scales with the loan amount.",
  },
  {
    question: "What happens to my EMI when the repo rate changes?",
    answer:
      "Most floating-rate home loans are linked to an external benchmark such as the RBI repo rate. When the benchmark changes, the lender resets your rate. Many lenders keep the EMI the same and adjust the remaining tenure instead, unless you ask for the EMI to change. Check your lender's reset policy.",
  },
  {
    question: "Does home loan EMI include insurance and processing fees?",
    answer:
      "No. The EMI covers principal and interest only. Processing fees are paid separately, and home or loan-protection insurance is either paid separately or, if financed, increases the loan amount and therefore the EMI.",
  },
  {
    question: "Is it better to prepay the home loan or invest the surplus?",
    answer:
      "Prepaying gives a guaranteed saving equal to your loan rate. Investing may earn more or less, with risk. Many borrowers do both: prepay to cut interest in the early years and invest the rest. Consider your loan rate, tax position, risk appetite and emergency fund.",
  },
  {
    question: "Are there tax benefits on home loan EMI?",
    answer:
      "In India, the old tax regime allows deductions on home loan interest under Section 24(b) and on principal repayment under Section 80C, subject to limits and conditions. The new tax regime does not allow these deductions for a self-occupied home. Tax rules change, so confirm with a tax professional.",
  },
];

export default function HomeLoanEmiCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="home-loan-emi"
      h1="Home Loan EMI Calculator"
      intro={
        <p>
          Calculate the monthly EMI on your home loan in seconds. Pick a quick amount or enter your own, then adjust the
          interest rate and tenure to see your EMI, total interest and year-by-year repayment schedule.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<HomeLoanEmiCalculator />}
      faqs={FAQS}
    >
      <h2>What is a home loan EMI?</h2>
      <p>
        A home loan EMI (Equated Monthly Instalment) is the fixed amount you pay your lender every month until the loan
        is repaid. Each EMI has two parts: <strong>interest</strong> on the outstanding balance, and{" "}
        <strong>principal</strong> that reduces what you owe. Home loans run for 15 to 30 years, so the split between
        the two changes a lot over the life of the loan.
      </p>

      <h2>How home loan EMI is calculated</h2>
      <p>Lenders use the reducing-balance formula:</p>
      <p className="formula">
        EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1]
      </p>
      <p>
        P is the loan amount, r is the monthly interest rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly
        instalments (years × 12). The calculator assumes the rate stays constant for the whole tenure, which is how
        lenders quote EMIs at sanction, even on floating-rate loans.
      </p>

      <h2>Example: ₹50 lakh home loan at 8.5% for 20 years</h2>
      <ul>
        <li>
          Monthly rate r = 8.5 ÷ 1,200 ≈ 0.007083; instalments n = 240
        </li>
        <li>
          <strong>EMI ≈ ₹43,391</strong> a month
        </li>
        <li>Total repayment ≈ ₹1,04,13,879, of which total interest ≈ ₹54,13,879</li>
      </ul>
      <p>
        In month one, about ₹35,417 of your EMI is interest and only about ₹7,974 repays principal. Over the whole first
        year you pay about ₹4.21 lakh in interest but reduce the loan by less than ₹1 lakh. You will not have repaid half
        the principal until year 14. By the final year, almost all of the EMI goes to principal.
      </p>

      <h2>EMI for common home loan amounts</h2>
      <p>At 8.5% for 20 years. EMI scales in direct proportion to the loan amount:</p>
      <table>
        <caption className="sr-only">Home loan EMI by loan amount at 8.5% for 20 years</caption>
        <thead>
          <tr>
            <th scope="col">Loan amount</th>
            <th scope="col" className="num">
              Monthly EMI
            </th>
            <th scope="col" className="num">
              Total interest
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>₹25 lakh</td>
            <td className="num">₹21,696</td>
            <td className="num">₹27,06,939</td>
          </tr>
          <tr>
            <td>₹50 lakh</td>
            <td className="num">₹43,391</td>
            <td className="num">₹54,13,879</td>
          </tr>
          <tr>
            <td>₹75 lakh</td>
            <td className="num">₹65,087</td>
            <td className="num">₹81,20,818</td>
          </tr>
          <tr>
            <td>₹1 crore</td>
            <td className="num">₹86,782</td>
            <td className="num">₹1,08,27,758</td>
          </tr>
        </tbody>
      </table>

      <h2>What happens when the interest rate increases?</h2>
      <p>
        Because a home loan runs for decades, small rate changes have a large effect. On the ₹50 lakh, 20-year loan:
      </p>
      <table>
        <caption className="sr-only">Effect of interest rate on a ₹50 lakh, 20-year home loan</caption>
        <thead>
          <tr>
            <th scope="col">Rate</th>
            <th scope="col" className="num">
              EMI
            </th>
            <th scope="col" className="num">
              Total interest
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>7.5%</td>
            <td className="num">₹40,280</td>
            <td className="num">₹46,67,118</td>
          </tr>
          <tr>
            <td>8.5%</td>
            <td className="num">₹43,391</td>
            <td className="num">₹54,13,879</td>
          </tr>
          <tr>
            <td>9.5%</td>
            <td className="num">₹46,607</td>
            <td className="num">₹61,85,574</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each percentage point adds about ₹3,100–3,200 to the monthly EMI and about ₹7.5–7.7 lakh to total interest.
        On a floating-rate loan, lenders often keep your EMI unchanged when rates rise and extend the tenure instead,
        which can increase total interest even more.
      </p>

      <h2>What happens when you increase the tenure?</h2>
      <table>
        <caption className="sr-only">Effect of tenure on a ₹50 lakh home loan at 8.5%</caption>
        <thead>
          <tr>
            <th scope="col">Tenure</th>
            <th scope="col" className="num">
              EMI
            </th>
            <th scope="col" className="num">
              Total interest
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>15 years</td>
            <td className="num">₹49,237</td>
            <td className="num">₹38,62,656</td>
          </tr>
          <tr>
            <td>20 years</td>
            <td className="num">₹43,391</td>
            <td className="num">₹54,13,879</td>
          </tr>
          <tr>
            <td>25 years</td>
            <td className="num">₹40,261</td>
            <td className="num">₹70,78,406</td>
          </tr>
          <tr>
            <td>30 years</td>
            <td className="num">₹38,446</td>
            <td className="num">₹88,40,443</td>
          </tr>
        </tbody>
      </table>
      <p>
        Going from 20 to 30 years lowers the EMI by about ₹4,945 a month but adds about ₹34 lakh in interest. A longer
        tenure buys monthly breathing room at a high long-term price.
      </p>

      <h2>How much interest will I pay?</h2>
      <p>
        Over a typical 20-year term at around 8–9%, total interest is roughly equal to the amount borrowed. Over 30 years
        it can be well above the loan amount. The calculator shows your exact figure, and the &ldquo;Key insights&rdquo;
        panel shows how it changes with rate and tenure.
      </p>

      <h2>How to reduce the total interest on your home loan</h2>
      <ul>
        <li>
          <strong>Make a larger down payment</strong> so you borrow less from the start.
        </li>
        <li>
          <strong>Choose the shortest tenure you can comfortably afford.</strong> You can still keep a buffer by
          prepaying instead of committing to a higher EMI.
        </li>
        <li>
          <strong>Prepay in the early years</strong>, when most of each EMI is interest. Even one extra EMI a year can cut
          years off a long loan. Individual borrowers on floating-rate home loans generally do not pay prepayment
          penalties, but confirm with your lender.
        </li>
        <li>
          <strong>Increase your EMI as your income rises.</strong> Many lenders allow this on request.
        </li>
        <li>
          <strong>Review your rate periodically.</strong> If your spread is high compared with new-customer offers, ask
          your lender for a reset or consider a balance transfer after accounting for fees.
        </li>
      </ul>

      <h2>Loan amount and EMI: the relationship</h2>
      <p>
        EMI is directly proportional to the loan amount: for the same rate and tenure, a 50% larger loan has a 50% larger
        EMI and 50% more total interest. If the EMI for the home you want is too high, your options are to borrow less,
        accept a longer tenure, or negotiate a lower rate. The{" "}
        <Link href="/calculators/home-loan-calculator">Home Loan Calculator</Link> helps you work backwards from the
        property price and down payment.
      </p>
      <p>
        Not sure how large a loan a lender will approve? The{" "}
        <Link href="/calculators/home-loan-eligibility-calculator">Home Loan Eligibility Calculator</Link> estimates it from
        your income and existing EMIs. If you already have a home loan, the{" "}
        <Link href="/calculators/loan-prepayment-calculator">Loan Prepayment Calculator</Link> shows how much interest a
        part-prepayment would save.
      </p>
    </CalculatorPageLayout>
  );
}
