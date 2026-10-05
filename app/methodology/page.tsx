import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { calculatorPath, getCalculator, type CalculatorId } from "@/lib/calculators/registry";
import { TAX_RULES } from "@/lib/calculations/taxRules";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `How ${siteConfig.name}'s calculators work: the formulas, assumptions, rounding rules and external references behind every result, calculator by calculator.`;

export const metadata = buildMetadata({
  title: "Calculation Methodology",
  description: DESCRIPTION,
  path: "/methodology",
});

function CalcLink({ id }: { id: CalculatorId }) {
  const c = getCalculator(id);
  return <Link href={calculatorPath(c)}>{c.name}</Link>;
}

export default function MethodologyPage() {
  return (
    <SimplePage title="Methodology" path="/methodology" description={DESCRIPTION}>
      <p>
        Every {siteConfig.name} calculator runs entirely in your browser using pure, separately tested calculation
        functions. This page documents what each one calculates and the assumptions it makes, so you can check any
        result yourself. Calculator pages also show their formula and a worked example.
      </p>

      <h2>Principles shared by every calculator</h2>
      <ul>
        <li>
          <strong>Standard formulas.</strong> Loans use the reducing-balance method with monthly compounding, the
          method used by Indian lenders for home, car, personal and education loans.
        </li>
        <li>
          <strong>Tested.</strong> Each calculation module has automated tests against hand-worked reference values,
          edge cases (zero, negative, missing and very large inputs, 0% interest) and checks that results are never
          NaN, infinite or negative where that would be meaningless.
        </li>
        <li>
          <strong>No hidden data.</strong> Rates, prices and returns are entered by you. Default values are
          illustrative starting points, not market rates or offers. The only external references are listed below,
          with dates.
        </li>
        <li>
          <strong>Rounding.</strong> Calculations use full precision internally. Results are displayed rounded to the
          nearest rupee (EMIs also to the paisa where shown). Lenders and payroll systems may round differently.
        </li>
      </ul>

      <h2>Loans and EMI</h2>
      <h3>EMI, Loan and Home Loan EMI calculators</h3>
      <p>
        The <CalcLink id="emi" />, <CalcLink id="loan" /> and <CalcLink id="home-loan-emi" /> use EMI = P × r × (1 +
        r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1], where P is the loan amount, r the annual rate ÷ 12 ÷ 100 and n the
        number of monthly instalments. At 0% the EMI is P ÷ n. Amortization schedules apply each month&apos;s interest
        to the outstanding balance and adjust the final instalment so the balance ends at exactly zero.
      </p>
      <h3>Car Loan Calculator</h3>
      <p>
        The <CalcLink id="car-loan" /> takes the loan as the on-road price minus your down payment and applies the same
        EMI formula. Total upfront cost adds any processing fee and other upfront costs you enter; total cost of the car
        adds every EMI. The optional affordability check compares the car EMI, and all EMIs together, with your
        take-home pay using rough planning bands (up to 10%, above 10% to 20%, above 20%). These bands are a planning
        heuristic, not a lending rule.
      </p>
      <h3>Loan Prepayment Calculator</h3>
      <p>
        The <CalcLink id="loan-prepayment" /> works out the EMI that repays your outstanding balance over the remaining
        tenure, then simulates the loan month by month with and without prepayments. Lump sums and extra monthly
        payments reduce principal after that month&apos;s EMI. With &ldquo;reduce tenure&rdquo; the EMI stays fixed;
        with &ldquo;reduce EMI&rdquo; it is recalculated after each lump sum over the months left in the original
        tenure, while extra monthly payments always shorten the loan. Any prepayment fee you enter is a percentage of
        each amount prepaid and is subtracted to give the net saving. The prepay-versus-invest illustration grows the
        same lump sum over the same period at the loan rate (guaranteed) and at your assumed return (uncertain,
        optionally after tax on gains).
      </p>

      <h2>Buying a home</h2>
      <h3>Home Loan Calculator</h3>
      <p>
        The <CalcLink id="home-loan" /> takes the loan as property price minus down payment, LTV as loan ÷ price, and
        total upfront cash as the down payment plus any stamp duty, registration and other costs you enter.
      </p>
      <h3>Home Loan Eligibility Calculator</h3>
      <p>
        The <CalcLink id="home-loan-eligibility" /> first finds the largest EMI you can take on: combined take-home
        income × an adjustable FOIR (fixed obligations to income ratio, 50% by default) minus existing EMIs and other
        fixed obligations. It converts that EMI into a loan amount as the present value of the monthly payments, EMI ×
        [(1 + r)<sup>n</sup> − 1] ÷ [r(1 + r)<sup>n</sup>]. The tenure is the lower of the one you choose and the years
        left until an adjustable retirement age (60 by default). The property budget divides the loan by the lower of
        your LTV assumption and the RBI limit for that loan size. FOIR and the retirement-age cap are common lender
        practice, not regulation, and vary between lenders.
      </p>
      <h3>Home Affordability Calculator</h3>
      <p>
        The <CalcLink id="home-affordability" /> estimates a comfortable budget from your own finances rather than a
        lender&apos;s rules. For each scenario (Conservative, Balanced, Aggressive) the new EMI is the lower of (a) your
        take-home income × that scenario&apos;s EMI-to-income ratio minus existing EMIs and (b) what is left each month
        after expenses, investments, existing EMIs and ownership costs. That EMI is converted into a maximum loan with
        the present-value formula. Cash for the purchase is your savings minus the emergency fund you want to keep. The
        maximum price is the highest price where the loan stays within both the EMI-based limit and the LTV limit, and
        the down payment plus purchase costs fit within that cash. The ratios are adjustable planning rules of thumb,
        not recommendations.
      </p>
      <h3>Property Purchase Cost Calculator</h3>
      <p>
        The <CalcLink id="property-purchase-cost" /> adds every one-time cost of buying to the agreement value: stamp
        duty, registration (with an optional cap), GST for under-construction homes, brokerage, legal fees, society
        deposits, other charges and upfront loan charges. Stamp duty and registration use only the rates or amounts you
        enter — no state rates are built in — applied to the property price or to a higher circle or guidance value if
        you enter one. Upfront cash is the down payment plus all these costs; total purchase cost is the price plus the
        costs, excluding loan interest. Fees are treated as inclusive of GST.
      </p>
      <h3>Rent vs Buy Calculator</h3>
      <p>
        The <CalcLink id="rent-vs-buy" /> follows two households with the same starting cash and the same monthly
        budget, month by month, for up to 30 years. The buyer pays the down payment, purchase costs, the EMI, and
        maintenance and ownership costs that rise each year. The renter invests the upfront cash and pays rent that
        rises each year. Whichever side spends less in a month invests the difference at your expected return,
        compounded monthly at the equivalent effective rate. The buyer&apos;s net position is the appreciated home value
        minus the outstanding loan and selling costs, plus any investments; the renter&apos;s is their portfolio. Tax
        effects, rent deposits and moving costs are excluded.
      </p>

      <h2>Investing</h2>
      <h3>SIP Calculator</h3>
      <p>
        The <CalcLink id="sip" /> treats each instalment as invested at the start of the month and compounds it at the
        expected annual return ÷ 12: FV = P × [(1 + i)<sup>n</sup> − 1] ÷ i × (1 + i). The return is an assumption you
        choose, not a forecast, and results are before tax and exit loads.
      </p>

      <h2>Salary and tax</h2>
      <h3>Salary Calculator</h3>
      <p>
        The <CalcLink id="salary" /> starts from CTC and removes employer PF (12% of basic, or of basic up to ₹15,000 a
        month) and, if included, gratuity (4.81% of basic) to get gross salary. It then deducts employee PF,
        professional tax as entered, other deductions, and income tax estimated under the selected regime. The tax
        estimate covers the standard deduction, the section 87A rebate with marginal relief, surcharge with marginal
        relief, and 4% health and education cess. Tax is rounded to the nearest rupee and spread evenly over 12 months.
        Other income, perquisites, variable pay and employer NPS contributions are not modelled.
      </p>

      <h2 id="references">External references and when they were checked</h2>
      <ul>
        <li>
          <strong>Income tax slabs</strong> ({TAX_RULES.taxYear}, {TAX_RULES.appliesTo.toLowerCase()}): from the{" "}
          <a href={TAX_RULES.source.url} rel="noopener noreferrer" target="_blank">
            {TAX_RULES.source.name}
          </a>
          ; {TAX_RULES.source.detail}. Last verified{" "}
          <time dateTime={TAX_RULES.lastVerified}>{formatDate(TAX_RULES.lastVerified)}</time>.
        </li>
        <li>
          <strong>Home loan loan-to-value limits</strong>: the Reserve Bank of India&apos;s general slabs for housing
          loans to individuals — 90% for loans up to ₹30 lakh, 80% above ₹30 lakh up to ₹75 lakh, and 75% above ₹75
          lakh. Used for indicative checks only; lenders may apply stricter limits.
        </li>
        <li>
          <strong>GST on under-construction homes</strong>: 5% (1% for affordable housing) without input tax credit, as
          notified by CBIC; ready-to-move homes with a completion certificate do not attract GST. Checked{" "}
          <time dateTime="2026-10-06">6 October 2026</time>.
        </li>
        <li>
          <strong>Provident fund</strong>: 12% employee and employer contributions on basic wages, with the ₹15,000
          monthly wage ceiling as an option, per EPFO rules.
        </li>
      </ul>
      <p>
        Stamp duty, registration charges, professional tax and lender-specific norms differ by state or lender and
        change over time, so the calculators ask you to enter them instead of assuming a figure.
      </p>

      <h2>What the calculators do not do</h2>
      <p>
        They do not predict interest-rate changes, market returns or property prices, and they do not check your credit
        profile or represent any lender&apos;s decision. Results are estimates for planning and comparison. Read the
        full <Link href="/disclaimer">disclaimer</Link>, and if you find an error, please{" "}
        <Link href="/contact">tell us</Link>.
      </p>
    </SimplePage>
  );
}
