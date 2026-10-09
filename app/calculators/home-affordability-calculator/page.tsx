import Link from "next/link";
import { HomeAffordabilityCalculator } from "@/components/calculators/HomeAffordabilityCalculator";
import { CalculatorPageLayout, type Source } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Home loan affordability calculator: see how much house you can afford from your take-home pay, expenses and savings, with EMI, down payment and upfront cash.";

export const metadata = buildMetadata({
  title: "Home Affordability Calculator – How Much House Can I Afford?",
  description: DESCRIPTION,
  path: "/calculators/home-affordability-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "How much house can I afford with a ₹1 lakh salary?",
    answer:
      "With ₹1 lakh take-home pay, ₹35,000 of living expenses, ₹15,000 of monthly investments, ₹3,000 of maintenance and ₹20 lakh of savings (₹3 lakh kept as an emergency fund), a Balanced budget is about ₹59 lakh at 8.5% for 20 years. That uses an EMI of ₹40,000 and all ₹17 lakh of usable savings for the down payment and purchase costs. Higher expenses, existing EMIs or lower savings bring the figure down.",
  },
  {
    question: "What percentage of salary should go to a home loan EMI?",
    answer:
      "A common planning rule is to keep all EMIs together within about 30–40% of take-home income, with up to 50% as a stretch. These are rules of thumb, not regulation. The right level for you depends on job stability, dependants, other goals and how much you want to keep investing.",
  },
  {
    question: "Is home affordability the same as home loan eligibility?",
    answer:
      "No. Eligibility is how much a lender may be willing to lend, usually based on gross income and its own limits. Affordability is how much you can repay comfortably after your actual expenses and savings goals. Many people are eligible for a larger loan than they can comfortably afford.",
  },
  {
    question: "Why does the calculator use take-home income rather than gross salary?",
    answer:
      "EMIs, rent and groceries are paid from the money that reaches your bank account, after tax and provident fund deductions. Using take-home income gives a more realistic picture of what you can afford each month.",
  },
  {
    question: "How much down payment do I need to buy a house in India?",
    answer:
      "RBI's housing finance guidelines cap the loan-to-value ratio at 90% for loans up to ₹30 lakh, 80% for loans above ₹30 lakh up to ₹75 lakh, and 75% above ₹75 lakh, so the minimum down payment is roughly 10–25% of the property value. Stamp duty, registration and other costs are usually paid on top, in cash. Many lenders ask for more than the minimum.",
  },
  {
    question: "Should I use my emergency fund for the down payment?",
    answer:
      "It is generally safer not to. A new home brings a large fixed EMI, and an emergency fund is what keeps you paying it through a job loss or medical expense. The calculator keeps the emergency fund aside and only uses savings above it.",
  },
  {
    question: "Does a longer loan tenure let me afford a bigger house?",
    answer:
      "Only up to a point. A longer tenure lowers the EMI per rupee borrowed, so the same EMI supports a bigger loan, but you pay much more interest overall. Once the bigger loan needs a down payment larger than your savings, a longer tenure stops helping at all.",
  },
];

const SOURCES: Source[] = [
  {
    name: "Reserve Bank of India — Master Circular on Housing Finance",
    url: "https://www.rbi.org.in",
    detail:
      "Loan-to-value limits for individual housing loans (90% up to ₹30 lakh, 80% above ₹30 lakh up to ₹75 lakh, 75% above ₹75 lakh). Search for the latest Master Circular – Housing Finance on the RBI website.",
  },
  {
    name: "EMI-to-income ratios",
    detail:
      "The Conservative, Balanced and Aggressive ratios are common personal-finance planning rules of thumb, not regulatory limits or any lender's policy.",
  },
];

export default function HomeAffordabilityCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="home-affordability"
      h1="Home Affordability Calculator"
      intro={
        <p>
          Find a property budget you can live with, not just one a bank will approve. Enter your take-home income,
          expenses, savings and emergency fund to see a comfortable price, the EMI it implies, the cash you need upfront
          and what actually limits your budget.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<HomeAffordabilityCalculator />}
      faqs={FAQS}
      sources={SOURCES}
    >
      <h2>How much house can I afford?</h2>
      <p>
        <strong>Short answer:</strong> the lower of two limits. Your monthly budget decides how big an EMI you can carry,
        which sets the largest loan. Your savings, after keeping an emergency fund, decide whether you can pay the down
        payment and purchase costs on that loan. A typical planning range keeps all EMIs together at about 30–40% of
        take-home pay.
      </p>
      <p>
        For example, someone taking home ₹1 lakh a month with ₹20 lakh saved can comfortably look at homes of around
        ₹48–59 lakh, and up to about ₹63 lakh at a stretch, under the assumptions in the worked example below. Your
        figure will differ with your expenses, existing loans and interest rate.
      </p>

      <h2>How this calculator works</h2>
      <p>The calculator runs three scenarios that differ only in how much of your income you allow EMIs to take:</p>
      <ol>
        <li>
          <strong>EMI room.</strong> For each scenario, the new EMI is the smaller of (a) your EMI-to-income limit minus
          existing EMIs, and (b) what is left of your take-home income after living expenses, monthly investments,
          existing EMIs and ownership costs such as maintenance.
        </li>
        <li>
          <strong>Largest loan.</strong> That EMI is converted into the largest loan it can repay at your interest rate
          and tenure.
        </li>
        <li>
          <strong>Cash for the purchase.</strong> Savings minus your emergency fund is the cash available for the down
          payment, stamp duty, registration and other purchase costs.
        </li>
        <li>
          <strong>Maximum price.</strong> The price is the highest one where the loan fits both your EMI room and the
          loan-to-value (LTV) limit, and the down payment plus purchase costs fit your cash.
        </li>
      </ol>
      <p>
        The calculator then shows which of these limits stopped the budget going higher, and lets you test a specific
        property price against your numbers.
      </p>

      <h2>Affordability rules of thumb</h2>
      <h3>EMI-to-income ratio</h3>
      <p>
        Personal-finance planners commonly suggest keeping total EMIs — home loan plus any car, personal or education
        loans — within about 30–40% of take-home income, treating 50% as an upper stretch. The calculator uses 30%
        (Conservative), 40% (Balanced) and 50% (Aggressive) by default, and you can change all three. These ratios are
        rules of thumb, not regulation, and lenders apply their own, different limits.
      </p>
      <h3>Why take-home income, not gross salary</h3>
      <p>
        Income tax, provident fund and other deductions never reach your account. A 40% ratio on gross salary can easily
        be 50% or more of what you actually receive, so this calculator works from take-home pay. If you are buying
        with a spouse or family member who will share the EMI, add their take-home income and expenses.
      </p>
      <h3>Keep an emergency fund</h3>
      <p>
        A home loan is a fixed commitment for decades. An emergency fund — often several months of expenses and EMIs —
        lets you keep paying through a job change, illness or a rate rise. The calculator never spends it on the
        purchase.
      </p>
      <h3>Keep investing</h3>
      <p>
        Draining every spare rupee into an EMI can leave retirement and children&apos;s education unfunded. Entering
        the monthly investments you want to continue protects them in the budget.
      </p>

      <h2>The formula</h2>
      <p>For an EMI-to-income ratio R:</p>
      <p className="formula">New EMI = min(Income × R − Existing EMIs, Income − Expenses − Investments − Existing EMIs − Ownership costs)</p>
      <p>The largest loan that EMI can repay is the present value of the instalments:</p>
      <p className="formula">
        Max loan = EMI × [(1 + r)<sup>n</sup> − 1] ÷ [r × (1 + r)<sup>n</sup>]
      </p>
      <p>
        where r is the monthly interest rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly instalments. At 0%
        interest the loan is simply EMI × n. With cash available C (savings − emergency fund), purchase costs c as a
        share of price and the applicable LTV limit L, the maximum price is:
      </p>
      <p className="formula">Price = min[(C + Max loan) ÷ (1 + c), C ÷ (1 + c − L)]</p>
      <p>
        The first term applies when the EMI limits the loan; the second when your savings cannot cover a larger down
        payment. Because the RBI LTV limit depends on the loan size, the calculator solves this for each LTV slab and
        takes the best result that respects the slab&apos;s loan ceiling.
      </p>

      <h2>Worked example: ₹1 lakh take-home salary</h2>
      <p>
        Take-home income ₹1,00,000 a month, no existing EMIs, living expenses ₹35,000, investments ₹15,000, maintenance
        and property tax ₹3,000, savings ₹20 lakh with ₹3 lakh kept as an emergency fund, home loan at 8.5% for 20
        years, purchase costs 7% and a maximum LTV of 80%.
      </p>
      <ul>
        <li>Cash available: ₹20,00,000 − ₹3,00,000 = ₹17,00,000</li>
        <li>Monthly room for a new EMI: ₹1,00,000 − ₹35,000 − ₹15,000 − ₹3,000 = ₹47,000</li>
        <li>Balanced EMI: min(40% × ₹1,00,000, ₹47,000) = ₹40,000</li>
        <li>Largest loan for ₹40,000 at 8.5% over 240 months ≈ ₹46,09,234</li>
        <li>
          Price = min[(₹17,00,000 + ₹46,09,234) ÷ 1.07, ₹17,00,000 ÷ 0.27] = min(₹58,96,480, ₹62,96,296) ={" "}
          <strong>₹58,96,480</strong>
        </li>
      </ul>
      <table>
        <caption className="sr-only">Home affordability scenarios for a ₹1 lakh take-home salary</caption>
        <thead>
          <tr>
            <th scope="col">Scenario</th>
            <th scope="col" className="num">
              Home loan EMI
            </th>
            <th scope="col" className="num">
              Loan
            </th>
            <th scope="col" className="num">
              Property price
            </th>
            <th scope="col" className="num">
              Left each month
            </th>
            <th scope="col">Limited by</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Conservative (30%)</td>
            <td className="num">₹30,000</td>
            <td className="num">₹34,56,925</td>
            <td className="num">₹48,19,556</td>
            <td className="num">₹17,000</td>
            <td>EMI-to-income limit</td>
          </tr>
          <tr>
            <td>Balanced (40%)</td>
            <td className="num">₹40,000</td>
            <td className="num">₹46,09,234</td>
            <td className="num">₹58,96,480</td>
            <td className="num">₹7,000</td>
            <td>EMI-to-income limit</td>
          </tr>
          <tr>
            <td>Aggressive (50%)</td>
            <td className="num">₹43,713</td>
            <td className="num">₹50,37,037</td>
            <td className="num">₹62,96,296</td>
            <td className="num">₹3,287</td>
            <td>Savings for down payment</td>
          </tr>
        </tbody>
      </table>
      <p>
        In the Balanced case the down payment is ₹12,87,246 and purchase costs are ₹4,12,754, which together use the
        full ₹17 lakh. The monthly housing cost is ₹43,000 (EMI plus ownership costs), and ₹7,000 is left each month
        after everything else.
      </p>
      <p>
        The Aggressive scenario shows why both limits matter. A 50% ratio allows ₹50,000 of EMIs, but the monthly budget
        only leaves ₹47,000. Even that is not fully usable: at an 80% LTV, a home above about ₹63 lakh needs more than
        ₹17 lakh for the down payment and costs, so savings cap the price and the actual EMI is ₹43,713.
      </p>
      <p>
        Checking an ₹80 lakh flat with the same numbers: the loan would be ₹64 lakh with an EMI of about ₹55,541 — 55.5%
        of take-home income, above the Aggressive limit — and the ₹21.6 lakh needed upfront is ₹4.6 lakh more than the
        cash available.
      </p>

      <h2>What limits your budget</h2>
      <h3>EMI-to-income limit</h3>
      <p>
        When your expenses are modest, the ratio you choose is the binding limit. At 8.5% over 20 years, every ₹10,000 of
        EMI supports a loan of about ₹11.5 lakh, so moving from the Balanced to the Conservative ratio on a ₹1 lakh income
        lowers the loan by about ₹11.5 lakh.
      </p>
      <h3>Monthly cash flow</h3>
      <p>
        High living costs, a large SIP or maintenance charges can leave less room than the ratio allows. In that case
        the ratio does not matter; what is left after your outgoings sets the EMI.
      </p>
      <h3>Savings for the down payment</h3>
      <p>
        Lenders finance only part of the price, and purchase costs are usually paid in cash. If your savings above the
        emergency fund are small, they cap the price no matter how high your income is.
      </p>
      <h3>Loan-to-value slabs</h3>
      <p>
        RBI&apos;s guidelines lower the maximum LTV as the loan grows: 90% up to ₹30 lakh, 80% up to ₹75 lakh and 75%
        above. Just above a slab boundary, a slightly bigger loan needs a noticeably bigger down payment, so the best
        budget sometimes holds the loan exactly at ₹30 lakh or ₹75 lakh. The calculator also lets you set a lower
        maximum LTV, since many lenders finance less than the regulatory ceiling.
      </p>

      <h2>How to increase what you can afford</h2>
      <ul>
        <li>
          <strong>Save a bigger down payment.</strong> In the worked example, every extra ₹1 lakh of savings adds about
          ₹93,000 to the Balanced budget (₹1 lakh ÷ 1.07), because the EMI side has room to spare.
        </li>
        <li>
          <strong>Choose a longer tenure — with care.</strong> At 25 years the same ₹40,000 EMI supports about ₹49.7
          lakh instead of ₹46.1 lakh, lifting the Balanced budget to about ₹62.3 lakh. At 30 years savings become the
          limit and the budget stops at about ₹63 lakh. Each extra year also adds substantially to total interest; the{" "}
          <Link href="/calculators/home-loan-emi-calculator">home loan EMI calculator</Link> shows the full cost.
        </li>
        <li>
          <strong>Clear other EMIs first.</strong> A ₹10,000 car loan EMI takes the same space as ₹10,000 of home loan
          EMI. In the example it would cut the Balanced budget from about ₹59 lakh to about ₹48 lakh.
        </li>
        <li>
          <strong>Add a co-applicant.</strong> Combining incomes and savings with a spouse or parent raises both limits,
          but both of you become responsible for the full loan.
        </li>
        <li>
          <strong>Get a better rate.</strong> At 9.5% instead of 8.5%, the Balanced budget in the example falls from
          about ₹59 lakh to about ₹56 lakh. A good credit score helps you negotiate.
        </li>
      </ul>

      <h2>Costs people forget</h2>
      <ul>
        <li>
          <strong>Stamp duty and registration</strong>, which vary by state, property value and sometimes the
          buyer&apos;s gender. The{" "}
          <Link href="/calculators/property-purchase-cost-calculator">property purchase cost calculator</Link> helps
          you get a precise figure to use in place of the 7% default.
        </li>
        <li>
          <strong>GST</strong> on under-construction homes, plus parking, club membership and preferential location
          charges on the builder&apos;s cost sheet.
        </li>
        <li>
          <strong>Loan processing fees, legal and technical checks</strong>, and brokerage if you use an agent.
        </li>
        <li>
          <strong>Maintenance deposits, society transfer charges, interiors, furniture and moving costs</strong>, which
          can add lakhs in the first year.
        </li>
        <li>
          <strong>Ongoing costs</strong>: monthly maintenance, property tax and home insurance. Enter them as ownership
          costs so they reduce your monthly room.
        </li>
      </ul>
      <p>
        If you are still deciding whether to buy at all, the{" "}
        <Link href="/calculators/rent-vs-buy-calculator">rent vs buy calculator</Link> compares the long-term cost of
        owning with renting and investing the difference.
      </p>

      <h2>Affordability vs bank eligibility</h2>
      <p>
        A lender&apos;s eligibility check asks how much it is willing to lend. It typically looks at your income, age,
        existing EMIs, credit score and the property, and may allow a higher share of income for EMIs than you would
        choose. This calculator asks a different question: how much you can repay without giving up your emergency
        fund, your investments or your day-to-day comfort.
      </p>
      <p>
        Use both. The <Link href="/calculators/home-loan-eligibility-calculator">home loan eligibility calculator</Link>{" "}
        estimates the loan you may qualify for. If it is higher than your affordable loan here, the gap is room you can
        choose not to use. If it is lower, the lender&apos;s limit will bind, and you will need a larger down payment or
        a lower price.
      </p>
    </CalculatorPageLayout>
  );
}
