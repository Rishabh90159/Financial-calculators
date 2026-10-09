import Link from "next/link";
import { HomeLoanEligibilityCalculator } from "@/components/calculators/HomeLoanEligibilityCalculator";
import { CalculatorPageLayout, type Source } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Estimate how much home loan you can get on your salary. See your max EMI, eligible loan and property budget from income, existing EMIs, age, tenure and rate.";

export const metadata = buildMetadata({
  title: "Home Loan Eligibility Calculator – Check Eligibility by Salary",
  description: DESCRIPTION,
  path: "/calculators/home-loan-eligibility-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "How much home loan can I get on a ₹1 lakh monthly salary?",
    answer:
      "With a take-home salary of ₹1 lakh, no other EMIs and a lender allowing 50% of income for EMIs, your maximum EMI is about ₹50,000. At 8.5% for 20 years, that supports a loan of roughly ₹57.6 lakh. A ₹10,000 car or personal loan EMI would bring it down to about ₹46.1 lakh. Lenders' own FOIR limits and income definitions can move this figure either way.",
  },
  {
    question: "How much home loan can I get on a ₹40,000 salary?",
    answer:
      "With a take-home salary of ₹40,000, no other EMIs and a 50% FOIR, your maximum EMI is about ₹20,000. At 8.5% for 20 years that supports a loan of roughly ₹23 lakh, and on a ₹30,000 salary roughly ₹17.3 lakh. Lenders' FOIR limits, the rate you are offered and your age can move this either way.",
  },
  {
    question: "What is FOIR in a home loan?",
    answer:
      "FOIR (Fixed Obligation to Income Ratio) is the share of your monthly income that all your EMIs and fixed obligations, including the new home loan EMI, may take up. It is a lender's internal policy, not a regulatory rule, so the limit varies between lenders, and many allow a higher share at higher incomes. This calculator uses 50% by default and lets you change it.",
  },
  {
    question: "Does my age affect home loan eligibility?",
    answer:
      "Yes. Most lenders want the loan repaid by a set age, commonly around retirement for salaried borrowers and somewhat later for self-employed borrowers. The older you are, the shorter the tenure available, and a shorter tenure means a smaller loan for the same EMI. At 45, a loan that must end by 60 can run only 15 years.",
  },
  {
    question: "What is the maximum tenure for a home loan?",
    answer:
      "Many lenders offer home loans of up to 30 years, and some offer longer. In practice the tenure is also limited by the age by which the loan must be repaid, commonly around 60 to 70 depending on the lender and whether you are salaried or self-employed. This calculator caps the tenure at the repayment age you set, 60 by default.",
  },
  {
    question: "Is there a minimum salary for a home loan?",
    answer:
      "There is no regulatory minimum; each lender sets its own income criteria, which vary by lender, city and type of employment. What usually limits a lower salary is the loan amount: at 50% FOIR, a ₹20,000 take-home salary supports an EMI of about ₹10,000, or roughly ₹11.5 lakh at 8.5% over 20 years.",
  },
  {
    question: "Can I add my spouse's income to increase eligibility?",
    answer:
      "Many lenders let you add an earning spouse, parent or other close relative as a co-applicant and count their income. In the example on this page, adding a co-applicant earning ₹40,000 a month raises the estimate from about ₹46.1 lakh to about ₹69.1 lakh. The co-applicant is equally responsible for repayment, and their credit history and obligations are checked too.",
  },
  {
    question: "Why does my bank show a different eligibility amount?",
    answer:
      "Lenders may use gross rather than take-home income, a different FOIR for your income band, a different rate based on your credit score, or a shorter maximum tenure. They may count only part of variable pay, bonuses or rental income, and they cap the loan by property value. This calculator gives a consistent estimate; the lender's sanction letter is what counts.",
  },
  {
    question: "Does the property price limit how much I can borrow?",
    answer:
      "Yes. Even if your income supports a large loan, the loan cannot exceed the lender's loan-to-value limit. Under RBI guidelines, housing loans to individuals can generally be up to 90% of the property value for loans up to ₹30 lakh, 80% above ₹30 lakh up to ₹75 lakh, and 75% above ₹75 lakh. Lenders may set lower limits.",
  },
  {
    question: "Is it wise to borrow the full amount I am eligible for?",
    answer:
      "Not necessarily. Eligibility is the most a lender may offer, not what is comfortable for your budget. Leave room for savings, an emergency fund, rising costs and possible rate increases on a floating-rate loan. The Home Affordability Calculator helps you find a budget based on your expenses as well as your income.",
  },
];

const SOURCES: Source[] = [
  {
    name: "Reserve Bank of India — Master Circular on Housing Finance",
    url: "https://www.rbi.org.in",
    detail:
      "Loan-to-value limits for housing loans to individuals (90% / 80% / 75% by loan size). Search 'Master Circular – Housing Finance' on the RBI site for the current version.",
  },
  {
    name: "FOIR and retirement-age limits",
    detail: "Common lender practice, not regulation. Defaults on this page are adjustable assumptions.",
  },
];

export default function HomeLoanEligibilityCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="home-loan-eligibility"
      h1="Home Loan Eligibility Calculator"
      intro={
        <p>
          Find out roughly how much home loan you can get on your salary. Enter your take-home income, any existing EMIs,
          your age and the rate you expect, and see your <strong>estimated maximum EMI, eligible loan amount</strong> and
          the property budget it supports.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<HomeLoanEligibilityCalculator />}
      faqs={FAQS}
      sources={SOURCES}
    >
      <h2>What is home loan eligibility?</h2>
      <p>
        Home loan eligibility is the largest loan a lender is likely to offer you. It depends mainly on how much EMI you
        can afford from your income after existing commitments, how long you can repay for, and the interest rate. The
        lender then checks that the loan does not exceed its limit as a share of the property&apos;s value.
      </p>
      <p>
        This calculator estimates that figure using the same building blocks lenders start with. It is a planning
        estimate, not an approval: the final amount is set by the lender after assessing your documents, credit record
        and the property.
      </p>

      <h2>How home loan eligibility is calculated</h2>
      <h3>Step 1: the maximum EMI you can take on (FOIR)</h3>
      <p>
        Lenders limit the share of your monthly income that can go towards all EMIs and fixed obligations together.
        This is the FOIR (Fixed Obligation to Income Ratio). It is lender practice rather than a regulation, and it
        varies by lender and income level. This calculator uses 50% by default, and you can change it.
      </p>
      <p className="formula">Max new EMI = (your income + co-applicant income) × FOIR − existing EMIs − other obligations</p>
      <h3>Step 2: converting the EMI into a loan amount</h3>
      <p>
        The eligible loan is the amount that this EMI can fully repay over the tenure at the given rate. This is the
        present value of the EMI stream, the reverse of the standard EMI formula:
      </p>
      <p className="formula">
        Loan = EMI × [(1 + r)<sup>n</sup> − 1] ÷ [r × (1 + r)<sup>n</sup>]
      </p>
      <p>
        r is the monthly rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly instalments. The tenure used is
        the lower of the tenure you want and the years left until the age by which the loan must end (60 by default).
      </p>
      <h3>Step 3: the property budget</h3>
      <p>
        Lenders finance only part of the property price. The calculator divides the eligible loan by the loan-to-value
        (LTV) ratio to estimate the property budget, using the lower of your LTV assumption (80% by default) and the RBI
        limit for that loan size: 90% for loans up to ₹30 lakh, 80% above ₹30 lakh up to ₹75 lakh, and 75% above ₹75
        lakh. The difference between the budget and the loan is your down payment.
      </p>

      <h2>Worked example: ₹1 lakh salary with a ₹10,000 car loan EMI</h2>
      <p>
        Take a 30-year-old with a take-home salary of ₹1,00,000 a month, an existing car loan EMI of ₹10,000, a desired
        tenure of 20 years and an expected rate of 8.5%. The default assumptions apply: 50% FOIR, loan to end by 60, 80%
        LTV.
      </p>
      <table>
        <caption className="sr-only">Worked example of home loan eligibility on a ₹1 lakh monthly salary</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col" className="num">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Income available for all EMIs (₹1,00,000 × 50%)</td>
            <td className="num">₹50,000</td>
          </tr>
          <tr>
            <td>Less existing EMI</td>
            <td className="num">₹10,000</td>
          </tr>
          <tr>
            <td>Maximum new home loan EMI</td>
            <td className="num">₹40,000</td>
          </tr>
          <tr>
            <td>Tenure (age 30, loan ends by 60, so 20 years is allowed)</td>
            <td className="num">240 months</td>
          </tr>
          <tr>
            <td>Eligible loan (present value of ₹40,000 a month at 8.5%)</td>
            <td className="num">₹46,09,234</td>
          </tr>
          <tr>
            <td>LTV used (loan is between ₹30 lakh and ₹75 lakh, so RBI limit is 80%)</td>
            <td className="num">80%</td>
          </tr>
          <tr>
            <td>Estimated property budget (₹46,09,234 ÷ 0.80)</td>
            <td className="num">₹57,61,542</td>
          </tr>
          <tr>
            <td>Down payment needed</td>
            <td className="num">₹11,52,308</td>
          </tr>
          <tr>
            <td>Total repayment (₹40,000 × 240)</td>
            <td className="num">₹96,00,000</td>
          </tr>
          <tr>
            <td>Total interest</td>
            <td className="num">₹49,90,766</td>
          </tr>
        </tbody>
      </table>
      <p>
        Without the car loan, the same person could borrow about ₹57,61,542. The ₹10,000 EMI therefore reduces
        eligibility by about ₹11.5 lakh. The down payment excludes stamp duty, registration and other charges; the{" "}
        <Link href="/calculators/property-purchase-cost-calculator">Property Purchase Cost Calculator</Link> adds those
        up.
      </p>

      <h2>How salary affects home loan eligibility</h2>
      <p>
        With the FOIR fixed, the maximum EMI rises in step with income, and so does the eligible loan. At 8.5% for 20
        years with 50% FOIR and no other EMIs:
      </p>
      <table>
        <caption className="sr-only">Estimated home loan eligibility by monthly take-home salary</caption>
        <thead>
          <tr>
            <th scope="col">Monthly take-home salary</th>
            <th scope="col" className="num">
              Max EMI
            </th>
            <th scope="col" className="num">
              Eligible loan
            </th>
            <th scope="col" className="num">
              Property budget
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>₹20,000</td>
            <td className="num">₹10,000</td>
            <td className="num">₹11,52,308</td>
            <td className="num">₹14,40,385</td>
          </tr>
          <tr>
            <td>₹25,000</td>
            <td className="num">₹12,500</td>
            <td className="num">₹14,40,385</td>
            <td className="num">₹18,00,482</td>
          </tr>
          <tr>
            <td>₹30,000</td>
            <td className="num">₹15,000</td>
            <td className="num">₹17,28,463</td>
            <td className="num">₹21,60,578</td>
          </tr>
          <tr>
            <td>₹40,000</td>
            <td className="num">₹20,000</td>
            <td className="num">₹23,04,617</td>
            <td className="num">₹28,80,771</td>
          </tr>
          <tr>
            <td>₹50,000</td>
            <td className="num">₹25,000</td>
            <td className="num">₹28,80,771</td>
            <td className="num">₹36,00,964</td>
          </tr>
          <tr>
            <td>₹75,000</td>
            <td className="num">₹37,500</td>
            <td className="num">₹43,21,156</td>
            <td className="num">₹54,01,446</td>
          </tr>
          <tr>
            <td>₹1,00,000</td>
            <td className="num">₹50,000</td>
            <td className="num">₹57,61,542</td>
            <td className="num">₹72,01,927</td>
          </tr>
          <tr>
            <td>₹1,50,000</td>
            <td className="num">₹75,000</td>
            <td className="num">₹86,42,313</td>
            <td className="num">₹1,15,23,084</td>
          </tr>
          <tr>
            <td>₹2,00,000</td>
            <td className="num">₹1,00,000</td>
            <td className="num">₹1,15,23,084</td>
            <td className="num">₹1,53,64,112</td>
          </tr>
        </tbody>
      </table>
      <p>
        Property budgets use the calculator&apos;s default 80% LTV up to ₹75 lakh of loan and the RBI limit of 75% above
        that, so at higher salaries a larger share of the price has to come from your down payment. For loans up to ₹30
        lakh, RBI allows up to 90% LTV, so with a lender that finances 90% the budget on a smaller salary can be higher
        than shown; set the LTV in the calculator to check. If you know only your CTC, the{" "}
        <Link href="/calculators/salary-calculator">Salary Calculator</Link> can help estimate your take-home pay first.
      </p>

      <h2>How existing EMIs affect eligibility</h2>
      <p>
        Every rupee of existing EMI is a rupee less for the new loan. At 8.5% over 20 years, each ₹10,000 of monthly EMI
        supports about ₹11.5 lakh of home loan, so an existing ₹10,000 EMI cuts eligibility by roughly that amount.
        Closing a small personal loan or car loan before applying can make a noticeable difference. Some lenders also
        count a share of credit card limits or outstanding dues as an obligation.
      </p>

      <h2>Does tenure affect home loan eligibility?</h2>
      <p>
        Yes. A longer tenure spreads the loan over more instalments, so the same EMI supports a larger loan, but the
        gain shrinks as tenure grows and total interest climbs. For the worked example (₹40,000 EMI at 8.5%):
      </p>
      <table>
        <caption className="sr-only">Eligible loan for a ₹40,000 EMI at 8.5% by tenure</caption>
        <thead>
          <tr>
            <th scope="col">Tenure</th>
            <th scope="col" className="num">
              Eligible loan
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10 years</td>
            <td className="num">₹32,26,179</td>
          </tr>
          <tr>
            <td>15 years</td>
            <td className="num">₹40,61,988</td>
          </tr>
          <tr>
            <td>20 years</td>
            <td className="num">₹46,09,234</td>
          </tr>
          <tr>
            <td>25 years</td>
            <td className="num">₹49,67,543</td>
          </tr>
          <tr>
            <td>30 years</td>
            <td className="num">₹52,02,146</td>
          </tr>
        </tbody>
      </table>
      <p>
        Your age can cap the tenure. A 45-year-old whose loan must end by 60 can borrow over only 15 years, so with a
        ₹50,000 EMI capacity they would be eligible for about ₹50.8 lakh instead of ₹57.6 lakh over 20 years.
      </p>

      <h2>Does the interest rate affect eligibility?</h2>
      <p>
        Yes. At a higher rate, more of each EMI goes to interest, so the same EMI repays a smaller loan. For the worked
        example:
      </p>
      <table>
        <caption className="sr-only">Eligible loan for a ₹40,000 EMI over 20 years by interest rate</caption>
        <thead>
          <tr>
            <th scope="col">Interest rate</th>
            <th scope="col" className="num">
              Eligible loan
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>7.5%</td>
            <td className="num">₹49,65,285</td>
          </tr>
          <tr>
            <td>8.5%</td>
            <td className="num">₹46,09,234</td>
          </tr>
          <tr>
            <td>9.5%</td>
            <td className="num">₹42,91,241</td>
          </tr>
          <tr>
            <td>10.5%</td>
            <td className="num">₹40,06,491</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each percentage point moves eligibility by roughly ₹2.9–3.6 lakh here. A strong credit score can help you get a
        lower rate, which raises eligibility without any change in income.
      </p>

      <h2>What factors do banks consider for home loan eligibility?</h2>
      <ul>
        <li>
          <strong>Income and its stability:</strong> salary history, employer profile, or for self-employed borrowers,
          business vintage and filed income tax returns.
        </li>
        <li>
          <strong>Existing obligations:</strong> all running EMIs and sometimes credit card usage.
        </li>
        <li>
          <strong>Credit score and repayment history:</strong> affects both approval and the rate offered.
        </li>
        <li>
          <strong>Age and remaining working years:</strong> sets the maximum tenure.
        </li>
        <li>
          <strong>Property:</strong> its value, type, approvals and clear legal title. The loan is capped by LTV limits.
        </li>
        <li>
          <strong>Co-applicants:</strong> their income can be added, and their credit record is checked too.
        </li>
      </ul>

      <h2>Why online estimates differ from actual bank eligibility</h2>
      <p>
        Every lender has its own policy. Many lenders calculate FOIR on gross monthly income rather than take-home pay,
        apply higher FOIR limits at higher incomes, count only part of variable pay or rental income, or allow
        repayment up to a later age for some borrowers. The rate offered also depends on your credit profile. This
        calculator uses one transparent method so you can compare scenarios, but treat the result as a starting point
        for conversations with lenders.
      </p>

      <h2>How to improve your home loan eligibility</h2>
      <ul>
        <li>
          <strong>Close or reduce small loans</strong> before applying, since each EMI reduces eligibility directly.
        </li>
        <li>
          <strong>Add an earning co-applicant.</strong> In the worked example, a co-applicant earning ₹40,000 a month
          raises the estimate from about ₹46.1 lakh to about ₹69.1 lakh.
        </li>
        <li>
          <strong>Choose a longer tenure</strong> if your age allows, and prepay later when you can.
        </li>
        <li>
          <strong>Keep a good credit score</strong> by paying all dues on time, which can also get you a better rate.
        </li>
        <li>
          <strong>Declare all regular income</strong> the lender may accept, with documents to support it.
        </li>
        <li>
          <strong>Make a larger down payment</strong> if the property price, rather than your income, is what limits the
          loan.
        </li>
      </ul>
      <p>
        Being eligible for a loan does not mean the EMI will be comfortable. Use the{" "}
        <Link href="/calculators/home-affordability-calculator">Home Affordability Calculator</Link> to check a budget
        against your expenses and savings, and the <Link href="/calculators/home-loan-emi-calculator">Home Loan EMI
        Calculator</Link> to see the repayment schedule for the loan you choose.
      </p>
    </CalculatorPageLayout>
  );
}
