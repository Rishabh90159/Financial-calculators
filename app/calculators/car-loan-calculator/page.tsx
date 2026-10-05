import Link from "next/link";
import { CarLoanCalculator } from "@/components/calculators/CarLoanCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Calculate your car loan EMI, total interest and full cost of the car from the on-road price and down payment. Compare 3–7 year tenures and check affordability.";

export const metadata = buildMetadata({
  title: "Car Loan Calculator – Calculate EMI, Interest & Total Payment",
  description: DESCRIPTION,
  path: "/calculators/car-loan-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "What is the EMI on a ₹8 lakh car loan?",
    answer:
      "At 9% a year on a reducing balance, a ₹8 lakh car loan costs about ₹16,607 a month over 5 years, with total interest of about ₹1,96,401. Over 3 years the EMI rises to about ₹25,440 but interest falls to about ₹1,15,832. Use the calculator with your own rate and tenure.",
  },
  {
    question: "Should I use the ex-showroom price or the on-road price?",
    answer:
      "Start from the on-road price, which adds registration/RTO charges, insurance and other charges to the ex-showroom price. That is what you actually pay. Many lenders calculate the loan on a particular price figure and finance only part of it, so if your loan offer is for a different amount, adjust the down payment until the loan amount matches.",
  },
  {
    question: "Is a dealer's flat interest rate the same as a bank's rate?",
    answer:
      "No. A flat rate charges interest on the full original loan for the whole tenure, while a reducing-balance rate charges interest only on what you still owe. On ₹8 lakh over 5 years, a 9% flat rate means ₹3,60,000 of interest, against about ₹1,96,401 at 9% on a reducing balance. Ask for the reducing-balance rate or compare total repayment.",
  },
  {
    question: "Is a longer car loan tenure a good idea?",
    answer:
      "A longer tenure lowers the EMI but raises total interest. On ₹8 lakh at 9%, going from 5 to 7 years cuts the EMI by about ₹3,735 but adds about ₹84,785 in interest. Cars also lose value over time, so with a long tenure you may owe more than the car is worth for longer. Choose the shortest tenure whose EMI fits comfortably.",
  },
  {
    question: "Does the EMI include the processing fee and insurance?",
    answer:
      "No. The EMI covers only the loan principal and interest. Add the processing fee and other upfront costs in the optional section to see your total upfront cost. Insurance for the first year is usually part of the on-road price; renewals each year are a separate running cost.",
  },
  {
    question: "Can I prepay or foreclose a car loan?",
    answer:
      "Usually yes, but terms vary. Some loans allow part-payments or foreclosure only after a minimum number of EMIs, and fixed-rate loans may carry a foreclosure charge. Check your loan agreement, then use the Loan Prepayment Calculator to see how much interest an early repayment could save.",
  },
  {
    question: "How much of my salary should go to a car EMI?",
    answer:
      "There is no single rule. As a rough planning guide, a car EMI of up to about 10% of take-home pay is a lower share, more than 10% to 20% is moderate, and above 20% is a higher share. Also look at all your EMIs together: many lenders become cautious when total EMIs pass roughly 40–50% of income.",
  },
];

export default function CarLoanCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="car-loan"
      h1="Car Loan Calculator"
      intro={
        <p>
          Enter the on-road price, your down payment, the interest rate and tenure to see your monthly car EMI, the
          total interest, and the <strong>total cost of the car</strong> once the loan is fully repaid. Compare tenures
          side by side and, if you like, check the EMI against your income.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<CarLoanCalculator />}
      faqs={FAQS}
    >
      <h2>How car loan EMI is calculated</h2>
      <p>
        The calculator first works out the loan you need, then applies the standard reducing-balance EMI formula used
        by banks and NBFCs:
      </p>
      <ol>
        <li>
          <strong>Loan amount</strong> = on-road price − down payment.
        </li>
        <li>
          <strong>EMI</strong> is the fixed monthly instalment that repays the loan and its interest over the tenure.
        </li>
        <li>
          <strong>Total interest</strong> = EMI × number of months − loan amount.
        </li>
        <li>
          <strong>Total upfront cost</strong> = down payment + processing fee + other upfront costs.
        </li>
        <li>
          <strong>Total cost of the car with the loan</strong> = total upfront cost + all EMIs.
        </li>
      </ol>
      <p className="formula">
        EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1]
      </p>
      <p>
        P is the loan amount, r the monthly interest rate (annual rate ÷ 12 ÷ 100) and n the number of monthly
        instalments. Each EMI pays that month&apos;s interest on the outstanding balance, and the rest reduces the
        balance. The <Link href="/calculators/emi-calculator">EMI Calculator</Link> explains the formula step by step.
      </p>

      <h2>Worked example: a ₹10 lakh car</h2>
      <p>
        Suppose the car costs ₹10 lakh on-road, you pay ₹2 lakh down and borrow the rest at 9% a year for 5 years.
      </p>
      <table>
        <caption className="sr-only">Car loan example: ₹10 lakh on-road price, ₹2 lakh down payment, 9%, 5 years</caption>
        <tbody>
          <tr>
            <th scope="row">On-road price</th>
            <td className="num">₹10,00,000</td>
          </tr>
          <tr>
            <th scope="row">Down payment (20%)</th>
            <td className="num">₹2,00,000</td>
          </tr>
          <tr>
            <th scope="row">Loan amount</th>
            <td className="num">₹8,00,000</td>
          </tr>
          <tr>
            <th scope="row">Monthly rate (9% ÷ 12)</th>
            <td className="num">0.75%</td>
          </tr>
          <tr>
            <th scope="row">Monthly EMI (60 months)</th>
            <td className="num">₹16,607</td>
          </tr>
          <tr>
            <th scope="row">Total interest</th>
            <td className="num">₹1,96,401</td>
          </tr>
          <tr>
            <th scope="row">Total loan repayment</th>
            <td className="num">₹9,96,401</td>
          </tr>
          <tr>
            <th scope="row">Total cost of the car with the loan</th>
            <td className="num">₹11,96,401</td>
          </tr>
        </tbody>
      </table>
      <p>
        Here (1.0075)<sup>60</sup> ≈ 1.5657, so EMI = 8,00,000 × 0.0075 × 1.5657 ÷ 0.5657 ≈ ₹16,607. Over five years
        the loan adds about ₹1.96 lakh of interest, so the ₹10 lakh car costs roughly ₹11.96 lakh in all, before any
        processing fee. A rate 1 percentage point higher (10%) would raise the EMI by about ₹391 and total interest by
        about ₹23,457.
      </p>

      <h2>Flat rate vs reducing balance</h2>
      <p>
        Some dealers and lenders quote a <strong>flat rate</strong>, which charges interest on the full original loan
        for the entire tenure even as you repay it. A <strong>reducing-balance</strong> rate charges interest only on
        what you still owe. The same headline number is far more expensive as a flat rate.
      </p>
      <table>
        <caption className="sr-only">₹8 lakh car loan over 5 years: flat rate compared with reducing balance</caption>
        <thead>
          <tr>
            <th scope="col">₹8 lakh, 5 years</th>
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
            <th scope="row">9% reducing balance</th>
            <td className="num">₹16,607</td>
            <td className="num">₹1,96,401</td>
          </tr>
          <tr>
            <th scope="row">9% flat</th>
            <td className="num">₹19,333</td>
            <td className="num">₹3,60,000</td>
          </tr>
          <tr>
            <th scope="row">5% flat</th>
            <td className="num">₹16,667</td>
            <td className="num">₹2,00,000</td>
          </tr>
        </tbody>
      </table>
      <p>
        Flat-rate interest is simply loan × rate × years: ₹8,00,000 × 9% × 5 = ₹3,60,000, about ₹1.64 lakh more than
        the reducing-balance loan. A 9% flat rate works out to roughly 15.7% on a reducing basis, and even a 5% flat
        quote is roughly 9.15% reducing. To compare offers fairly, ask for the reducing-balance rate (or the APR) and
        compare the total amount you will repay.
      </p>

      <h2>Choosing the tenure</h2>
      <p>For an ₹8 lakh loan at 9%, here is how tenure changes the cost:</p>
      <table>
        <caption className="sr-only">₹8 lakh car loan at 9% over 3 to 7 years</caption>
        <thead>
          <tr>
            <th scope="col">Tenure</th>
            <th scope="col" className="num">
              EMI
            </th>
            <th scope="col" className="num">
              Total interest
            </th>
            <th scope="col" className="num">
              Extra interest vs 3 years
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">3 years</th>
            <td className="num">₹25,440</td>
            <td className="num">₹1,15,832</td>
            <td className="num">—</td>
          </tr>
          <tr>
            <th scope="row">4 years</th>
            <td className="num">₹19,908</td>
            <td className="num">₹1,55,586</td>
            <td className="num">₹39,753</td>
          </tr>
          <tr>
            <th scope="row">5 years</th>
            <td className="num">₹16,607</td>
            <td className="num">₹1,96,401</td>
            <td className="num">₹80,569</td>
          </tr>
          <tr>
            <th scope="row">6 years</th>
            <td className="num">₹14,420</td>
            <td className="num">₹2,38,271</td>
            <td className="num">₹1,22,439</td>
          </tr>
          <tr>
            <th scope="row">7 years</th>
            <td className="num">₹12,871</td>
            <td className="num">₹2,81,186</td>
            <td className="num">₹1,65,354</td>
          </tr>
        </tbody>
      </table>
      <p>
        A longer tenure makes the EMI easier, but there is a second reason to keep it short: a car loses value from the
        day it is registered, while the loan balance falls slowly in the early years because most of each EMI goes to
        interest. With a long tenure, there can be a stretch where you owe more than the car would sell for. That
        matters if you want to sell or upgrade early, or if the car is written off. Picking the shortest tenure whose
        EMI you can carry comfortably keeps both the interest and this gap smaller.
      </p>

      <h2>Down payment trade-offs</h2>
      <p>
        Every rupee you pay down is a rupee you do not pay interest on. On the ₹10 lakh car at 9% for 5 years, a 10%
        down payment (₹9 lakh loan) means an EMI of about ₹18,683 and interest of ₹2,20,951. A 30% down payment (₹7
        lakh loan) brings the EMI to about ₹14,531 and interest to ₹1,71,851 — roughly ₹49,100 less.
      </p>
      <p>
        The trade-off is liquidity. Do not use your emergency fund for the down payment, and remember that the
        processing fee, accessories and the first service are also paid in cash. If your savings earn less than the
        loan rate after tax, a larger down payment usually saves money; if it leaves you short of cash, a slightly
        smaller one is often the safer choice.
      </p>

      <h2>Other costs of a car loan</h2>
      <h3>Processing and documentation fees</h3>
      <p>
        Many lenders charge a processing fee, often a percentage of the loan with GST on top, plus documentation or
        stamp charges. Enter the rupee amount in the optional section to include it in your upfront cost.
      </p>
      <h3>Insurance</h3>
      <p>
        First-year motor insurance is normally part of the on-road price, but you renew it every year. Dealers or
        lenders may also offer loan protection or add-on covers; these are usually optional, so check what you are
        signing up for and compare prices.
      </p>
      <h3>Prepayment and foreclosure terms</h3>
      <p>
        Rules on part-payment and closing the loan early differ across lenders and between fixed and floating rates.
        Some allow it only after a set number of EMIs or charge a fee. Read the loan agreement before signing. If you
        expect a bonus or other lump sum, the{" "}
        <Link href="/calculators/loan-prepayment-calculator">Loan Prepayment Calculator</Link> shows how much interest
        an early payment could save.
      </p>

      <h2>New vs used car loans</h2>
      <p>
        Loans for used cars usually carry higher interest rates and shorter maximum tenures than new-car loans, and
        lenders may finance a smaller share of the car&apos;s value, often based on the car&apos;s age and their own
        valuation rather than the agreed price. The calculator works the same way for both: enter the price you are
        paying, your down payment and the rate and tenure from your actual offer. For a loan amount you already know,
        the general <Link href="/calculators/loan-calculator">Loan Calculator</Link> also lets you enter tenure in
        months.
      </p>

      <h2>How much car can I afford?</h2>
      <p>
        Start from your monthly take-home pay, not the EMI a lender will approve. The optional affordability check
        above compares the car EMI with your income using a simple planning heuristic:
      </p>
      <ul>
        <li>
          <strong>Up to 10%</strong> of take-home pay — a lower share.
        </li>
        <li>
          <strong>More than 10% and up to 20%</strong> — a moderate share.
        </li>
        <li>
          <strong>More than 20%</strong> — a higher share; check that fuel, insurance, servicing and parking still fit.
        </li>
      </ul>
      <p>
        For example, the ₹16,607 EMI above is about 16.6% of a ₹1 lakh monthly take-home income, a moderate share.
        Also add up all your EMIs: as a general observation, many lenders become cautious once total EMIs pass roughly
        40–50% of income. These bands are rough guides, not rules or advice. Not sure of your in-hand pay? The{" "}
        <Link href="/calculators/salary-calculator">Salary Calculator</Link> estimates take-home salary from your CTC.
      </p>

      <h2>Assumptions and limitations</h2>
      <ul>
        <li>Interest is calculated monthly on the reducing balance at a fixed rate for the whole tenure.</li>
        <li>The first EMI is due one month after the loan is disbursed. Advance EMIs or broken-period interest are not modelled.</li>
        <li>Processing fees and other upfront costs are only what you enter, and are treated as paid upfront.</li>
        <li>Running costs such as fuel, servicing, insurance renewals and tolls are not included.</li>
        <li>Figures are rounded to the nearest rupee for display; your lender&apos;s rounding may differ slightly.</li>
      </ul>
    </CalculatorPageLayout>
  );
}
