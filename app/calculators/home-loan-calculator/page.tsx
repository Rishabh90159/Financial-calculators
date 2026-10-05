import Link from "next/link";
import { HomeLoanCalculator } from "@/components/calculators/HomeLoanCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Plan a home purchase from the property price: down payment, loan amount, loan-to-value ratio, EMI, total interest and the total cash you need upfront.";

export const metadata = buildMetadata({
  title: "Home Loan Calculator — Down Payment, LTV, EMI & Upfront Cost",
  description: DESCRIPTION,
  path: "/calculators/home-loan-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "How much down payment do I need for a home loan in India?",
    answer:
      "Lenders finance only part of the property value, so you pay the rest as a down payment. Under RBI guidelines, the maximum loan-to-value is generally 90% for loans up to ₹30 lakh, 80% for loans above ₹30 lakh up to ₹75 lakh, and 75% above ₹75 lakh. That means a minimum down payment of roughly 10–25%, and individual lenders may ask for more.",
  },
  {
    question: "What is loan-to-value (LTV) ratio?",
    answer:
      "LTV is the loan amount divided by the property value, as a percentage. A ₹64 lakh loan on an ₹80 lakh home has an LTV of 80%. Lower LTV means a bigger down payment, a smaller loan and lower total interest.",
  },
  {
    question: "Can stamp duty and registration be included in the home loan?",
    answer:
      "Generally no. Lenders usually calculate the eligible loan on the property's agreement value and exclude stamp duty and registration charges, so plan to pay these from your own funds. Check your lender's policy.",
  },
  {
    question: "Why doesn't this calculator use my state's stamp duty rate automatically?",
    answer:
      "Stamp duty and registration rates differ by state, sometimes by city, property value, property type and buyer category, and they change from time to time. To avoid showing an outdated or wrong figure, we ask you to enter the amount from your state's current schedule or your builder's cost sheet.",
  },
  {
    question: "What other costs should I budget for when buying a home?",
    answer:
      "Common extras include loan processing fees, legal and technical verification charges, brokerage, GST on under-construction properties, society transfer or maintenance deposits, home insurance, and furnishing. Add them under 'Other purchase costs' to see your full upfront requirement.",
  },
  {
    question: "Is it better to make a larger down payment?",
    answer:
      "A larger down payment reduces your loan, EMI and total interest, and may help you qualify for a better rate. But do not empty your savings. Keep an emergency fund and enough cash for purchase costs and moving in.",
  },
];

export default function HomeLoanCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="home-loan"
      h1="Home Loan Calculator"
      intro={
        <p>
          Start from the price of the home you want. Enter your down payment to see the loan you need, your monthly EMI,
          your loan-to-value ratio and the <strong>total cash you need upfront</strong>, including stamp duty and other
          costs if you add them.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<HomeLoanCalculator />}
      faqs={FAQS}
    >
      <h2>How this home loan calculation works</h2>
      <ol>
        <li>
          <strong>Loan amount</strong> = property price − down payment.
        </li>
        <li>
          <strong>Down payment %</strong> = down payment ÷ property price × 100, and <strong>LTV</strong> = loan amount ÷
          property price × 100. The two always add up to 100%.
        </li>
        <li>
          <strong>EMI</strong> uses the standard reducing-balance formula: EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)
          <sup>n</sup> − 1], where P is the loan amount, r the monthly rate and n the number of months.
        </li>
        <li>
          <strong>Total upfront cash</strong> = down payment + stamp duty + registration + other costs you enter.
        </li>
        <li>
          <strong>Total cost of buying</strong> = upfront cash + every EMI over the full tenure.
        </li>
      </ol>

      <h2>Example: buying an ₹80 lakh home</h2>
      <p>
        Suppose you buy an ₹80 lakh home with a 20% down payment, borrow the rest at 8.5% for 20 years, and your
        purchase costs come to ₹6 lakh. These cost figures are illustrative only; your state&apos;s rates will differ.
      </p>
      <table>
        <caption className="sr-only">Home purchase example</caption>
        <tbody>
          <tr>
            <th scope="row">Property price</th>
            <td className="num">₹80,00,000</td>
          </tr>
          <tr>
            <th scope="row">Down payment (20%)</th>
            <td className="num">₹16,00,000</td>
          </tr>
          <tr>
            <th scope="row">Loan amount (LTV 80%)</th>
            <td className="num">₹64,00,000</td>
          </tr>
          <tr>
            <th scope="row">Monthly EMI (8.5%, 20 years)</th>
            <td className="num">₹55,541</td>
          </tr>
          <tr>
            <th scope="row">Total interest</th>
            <td className="num">₹69,29,765</td>
          </tr>
          <tr>
            <th scope="row">Stamp duty + registration + other (example)</th>
            <td className="num">₹6,00,000</td>
          </tr>
          <tr>
            <th scope="row">Total upfront cash</th>
            <td className="num">₹22,00,000</td>
          </tr>
          <tr>
            <th scope="row">Total cost of buying with the loan</th>
            <td className="num">₹1,55,29,765</td>
          </tr>
        </tbody>
      </table>
      <p>
        Two things stand out. The cash needed on day one is ₹22 lakh, not ₹16 lakh, once purchase costs are included.
        And over 20 years, interest of about ₹69 lakh nearly matches the price of the home itself.
      </p>

      <h2>Understanding loan-to-value limits</h2>
      <p>
        Banks and housing finance companies in India lend only up to a set share of a property&apos;s value. RBI&apos;s
        guidelines generally cap LTV at <strong>90%</strong> for loans up to ₹30 lakh, <strong>80%</strong> for loans
        above ₹30 lakh and up to ₹75 lakh, and <strong>75%</strong> for loans above ₹75 lakh. The calculator flags your
        LTV if it is above the usual limit for your loan size. Lenders can be stricter and may also limit the loan based
        on your income and existing EMIs.
      </p>

      <h2>Factors that change your result</h2>
      <h3>Down payment</h3>
      <p>
        Each extra rupee of down payment is a rupee you do not borrow, so you avoid paying interest on it for the full
        tenure. In the example above, moving from 20% to 25% down cuts the loan by ₹4 lakh.
      </p>
      <h3>Interest rate and tenure</h3>
      <p>
        These work exactly as they do for any loan: higher rates raise both EMI and total interest, while longer tenures
        lower the EMI but raise total interest. Most Indian home loans are floating-rate, so your rate can change over
        the years.
      </p>
      <h3>Purchase costs</h3>
      <p>
        Stamp duty, registration and incidental costs are paid upfront and usually not financed. They can add a
        meaningful percentage to the property price. Get the current figures from your state&apos;s official sources or
        the builder&apos;s cost sheet before you finalise a budget.
      </p>

      <h2>Tips before you apply</h2>
      <ul>
        <li>
          <strong>Budget for the full upfront amount</strong>, not just the down payment, and keep an emergency fund
          separately.
        </li>
        <li>
          <strong>Get a written cost sheet</strong> from the seller listing every charge, including parking, club, GST
          and maintenance deposits.
        </li>
        <li>
          <strong>Compare lenders on rate, fees and reset terms</strong>, not just the advertised starting rate.
        </li>
        <li>
          <strong>Stress-test your EMI</strong> at a rate 1–2 percentage points higher to make sure it stays affordable
          if rates rise.
        </li>
      </ul>
      <p>
        Already know your loan amount? The{" "}
        <Link href="/calculators/home-loan-emi-calculator">Home Loan EMI Calculator</Link> focuses on EMI, interest and
        repayment schedule, with quick presets for common loan sizes.
      </p>
    </CalculatorPageLayout>
  );
}
