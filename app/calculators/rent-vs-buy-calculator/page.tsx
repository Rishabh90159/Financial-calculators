import Link from "next/link";
import { RentVsBuyCalculator } from "@/components/calculators/RentVsBuyCalculator";
import { CalculatorPageLayout } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Should you rent or buy a home? Compare your estimated net worth after buying with a home loan versus renting and investing the difference, year by year.";

export const metadata = buildMetadata({
  title: "Rent vs Buy Calculator – Compare the Cost of Renting vs Buying",
  description: DESCRIPTION,
  path: "/calculators/rent-vs-buy-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "Is it better to rent or buy a house in India?",
    answer:
      "There is no single answer. It depends on the price of the home compared with the rent for a similar home, your loan rate, how long you will stay, how fast rents and property prices rise, and what return you could earn by investing instead. This calculator shows which option comes out ahead on the assumptions you enter, and how much that answer changes if those assumptions are wrong.",
  },
  {
    question: "What is opportunity cost in a rent vs buy decision?",
    answer:
      "Money spent on a down payment, stamp duty and a higher monthly outgo cannot be invested elsewhere. Opportunity cost is the return you give up by putting that money into the house. The calculator captures it by assuming the renter invests the same upfront cash, plus any monthly saving compared with owning, at your expected return.",
  },
  {
    question: "Why does the calculator assume the difference is invested?",
    answer:
      "To make the comparison fair, both households start with the same cash and spend the same amount every month. If owning costs more than renting, the renter invests the gap; if rent costs more, the buyer invests the gap. Without this step, renting would look worse than it is because the money saved would simply disappear from the comparison. In real life the result only holds if the saving is actually invested and not spent.",
  },
  {
    question: "Does this calculator include home loan tax benefits?",
    answer:
      "No. Under the old tax regime, interest and principal repayment on a loan for a self-occupied home can reduce your taxable income within limits, while the new regime generally does not allow these deductions for a self-occupied home. Because the benefit depends on your regime, income and other deductions, it is left out. Tax on investment returns and capital gains on selling the house are also excluded. If you claim home loan deductions, buying will look somewhat better than shown here.",
  },
  {
    question: "What does the break-even year mean?",
    answer:
      "It is the first year in which the buyer's net position (home value minus loan outstanding minus selling cost, plus any investments) is at least equal to the renter's investments. Staying longer than the break-even period favours buying on your assumptions; selling earlier favours renting. If buying never catches up within 30 years, the calculator says so.",
  },
  {
    question: "What investment return and property appreciation should I enter?",
    answer:
      "Use rates you can justify for your own situation rather than optimistic ones. The investment return should reflect where you would realistically put the money and after costs; property appreciation should reflect the specific city and type of home. Neither is guaranteed. Use the sensitivity tables to see how the answer changes if either is 1–2 percentage points lower than you expect.",
  },
  {
    question: "Does the rent deposit change the result?",
    answer:
      "Slightly. A security deposit is money the renter cannot invest, but it is usually returned when you move out. The calculator ignores it. To account for it roughly, you can add the deposit to the purchase costs field, which reduces the renter's starting investment advantage by that amount.",
  },
];

export default function RentVsBuyCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="rent-vs-buy"
      h1="Rent vs Buy Calculator"
      intro={
        <p>
          Compare two paths for the same home: buying it with a home loan, or renting it and investing the money you
          would otherwise have put into the purchase. See your <strong>estimated net position under each option</strong>{" "}
          after 5, 10, 15 or any number of years, the break-even year, and which of your assumptions moves the answer
          most.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<RentVsBuyCalculator />}
      faqs={FAQS}
      investmentDisclaimer
    >
      <h2>Rent vs buy: the short answer</h2>
      <p>
        It depends, and mostly on a handful of numbers you can estimate: the property price compared with the rent for a
        similar home, the home loan rate, how long you plan to stay, and the growth rates you expect for rent, property
        prices and your investments. No calculator can tell you that one choice is better for everyone. What this one
        does is put both options on the same footing and show which comes out ahead on <em>your</em> assumptions, and
        by how much.
      </p>
      <p>
        It measures money only. Owning a home also brings security, freedom to renovate and no landlord; renting brings
        flexibility to move. Those matter, but they are for you to weigh against the numbers.
      </p>

      <h2>How the calculator compares renting and buying</h2>
      <p>
        Imagine two households with the same savings and the same monthly budget. One buys the home; the other rents a
        similar home. The calculator follows both month by month and asks: at the end of the period you choose, what
        would each household own?
      </p>
      <ol>
        <li>
          <strong>Same starting cash.</strong> The buyer spends the down payment and purchase costs. The renter invests
          that same amount.
        </li>
        <li>
          <strong>Same monthly spending.</strong> Each month, whichever household spends less invests the difference.
          Usually that is the renter, because EMI plus maintenance is higher than rent, but it can be the buyer when
          rent is high or once the loan is repaid.
        </li>
        <li>
          <strong>Compare at the end.</strong> The buyer is assumed to sell the home and repay the loan; the renter
          holds their investments.
        </li>
      </ol>

      <h2>What the buy side includes</h2>
      <ul>
        <li>
          <strong>Down payment and one-time purchase costs</strong> such as stamp duty, registration, legal fees and
          brokerage. These vary by state, so enter your own figure or estimate it with the{" "}
          <Link href="/calculators/property-purchase-cost-calculator">Property Purchase Cost Calculator</Link>.
        </li>
        <li>
          <strong>Home loan EMI</strong> on the amount borrowed, until the loan ends. Interest is on the reducing
          balance, exactly as in our <Link href="/calculators/home-loan-emi-calculator">Home Loan EMI Calculator</Link>.
        </li>
        <li>
          <strong>Maintenance and recurring ownership costs</strong> such as society charges and property tax, rising
          once a year.
        </li>
        <li>
          <strong>Home value</strong> growing at your expected appreciation rate, less the outstanding loan and the cost
          of selling (brokerage and similar charges) at the end.
        </li>
      </ul>

      <h2>What the rent side includes</h2>
      <p>
        The renter pays rent, rising once a year at the rate you enter. The important part is what the renter does
        <em> not</em> spend. The down payment and purchase costs stay invested from day one, and every month in which
        rent is lower than the cost of owning, the gap is invested too.
      </p>
      <p>
        This is the <strong>opportunity cost</strong> of buying: money tied up in a house cannot earn a return
        elsewhere. A comparison that only adds up &ldquo;rent paid&rdquo; against &ldquo;EMIs paid&rdquo; ignores it
        and will usually make buying look better than it is. Equally, the renter only gets this benefit if they really
        invest the difference, for example through a regular SIP, rather than spending it. You can see how a monthly
        investment builds up over time with the <Link href="/calculators/sip-calculator">SIP Calculator</Link>.
      </p>

      <h2>The method</h2>
      <p>All calculations run monthly. For month m (1, 2, 3 …) and year index k = the number of completed years:</p>
      <p className="formula">Rent in month m = starting rent × (1 + rent increase)^k</p>
      <p className="formula">
        Owning cost in month m = EMI (while the loan runs) + maintenance × (1 + cost increase)^k + yearly ownership
        costs ÷ 12 × (1 + cost increase)^k
      </p>
      <p className="formula">Monthly investment return = (1 + annual return)^(1/12) − 1</p>
      <p>
        Each month both portfolios first earn that month&apos;s return, then the side that spent less adds the
        difference. The renter&apos;s portfolio starts at down payment + purchase costs; the buyer&apos;s starts at
        zero. After N years:
      </p>
      <p className="formula">Home value = price × (1 + appreciation)^N</p>
      <p className="formula">
        Buy net position = home value − outstanding loan − (home value × selling cost %) + buyer&apos;s investments
      </p>
      <p className="formula">Rent net position = renter&apos;s investments</p>
      <p>
        The difference (buy − rent) is positive when buying comes out ahead. The break-even year is the first year, up
        to 30, in which this difference is zero or more. EMI and the outstanding loan come from the standard
        reducing-balance formula, EMI = P × r × (1 + r)<sup>n</sup> ÷ [(1 + r)<sup>n</sup> − 1].
      </p>

      <h2>Worked example: an ₹80 lakh home vs ₹25,000 rent, over 10 years</h2>
      <p>
        These are the calculator&apos;s default inputs. They are an illustration, not a forecast for any city: property
        price ₹80 lakh, down payment ₹16 lakh, loan of ₹64 lakh at 8.5% for 20 years, purchase costs ₹6 lakh,
        maintenance ₹3,000 a month and other ownership costs ₹6,000 a year (both rising 5% a year), selling cost 1%,
        rent ₹25,000 a month rising 5% a year, investment return 10% a year and property appreciation 5% a year.
      </p>
      <p>
        In the first month, owning costs ₹59,041 (EMI ₹55,541 + maintenance ₹3,000 + ₹500 towards yearly costs) against
        rent of ₹25,000. So the renter starts with ₹22 lakh invested and adds ₹34,041 in the first month, with the gap
        narrowing slowly as rent rises.
      </p>
      <table>
        <caption className="sr-only">Rent vs buy worked example after 10 years</caption>
        <thead>
          <tr>
            <th scope="col">After 10 years</th>
            <th scope="col" className="num">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Home value (₹80 lakh × 1.05^10)</th>
            <td className="num">₹1,30,31,157</td>
          </tr>
          <tr>
            <th scope="row">Loan still outstanding</th>
            <td className="num">₹44,79,605</td>
          </tr>
          <tr>
            <th scope="row">Cost of selling (1%)</th>
            <td className="num">₹1,30,312</td>
          </tr>
          <tr>
            <th scope="row">Buy: net position</th>
            <td className="num">₹84,21,241</td>
          </tr>
          <tr>
            <th scope="row">Rent: net position (renter&apos;s investments)</th>
            <td className="num">₹1,16,03,934</td>
          </tr>
          <tr>
            <th scope="row">Difference (renting ahead)</th>
            <td className="num">₹31,82,693</td>
          </tr>
          <tr>
            <th scope="row">Total rent paid</th>
            <td className="num">₹37,73,368</td>
          </tr>
          <tr>
            <th scope="row">Total paid by the buyer (upfront, EMIs, maintenance, tax)</th>
            <td className="num">₹93,93,154</td>
          </tr>
          <tr>
            <th scope="row">of which loan interest</th>
            <td className="num">₹47,44,487</td>
          </tr>
          <tr>
            <th scope="row">of which loan principal repaid</th>
            <td className="num">₹19,20,395</td>
          </tr>
        </tbody>
      </table>
      <p>
        On these assumptions, renting and investing the difference comes out about ₹31.83 lakh ahead after 10 years,
        and buying does not catch up within 30 years. That is not a general verdict on buying. Change one input, the
        rent for the same home, from ₹25,000 to ₹40,000 and buying comes out about ₹4.47 lakh ahead after 10 years, with
        break-even in year 8. The comparison is very sensitive to how expensive the home is relative to its rent.
      </p>

      <h2>Which assumptions matter most</h2>
      <p>
        The sensitivity tables under the calculator change one input at a time. For the example above, the difference
        after 10 years (buy − rent; negative means renting is ahead) moves like this:
      </p>
      <table>
        <caption className="sr-only">How the 10-year result changes when one assumption changes</caption>
        <thead>
          <tr>
            <th scope="col">Assumption changed</th>
            <th scope="col">Range tested</th>
            <th scope="col" className="num">
              Buy − rent at the low end
            </th>
            <th scope="col" className="num">
              Buy − rent at the high end
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Property appreciation</th>
            <td>3% to 7%</td>
            <td className="num">−₹54.40 lakh</td>
            <td className="num">−₹5.04 lakh</td>
          </tr>
          <tr>
            <th scope="row">Investment return</th>
            <td>8% to 12%</td>
            <td className="num">−₹16.10 lakh</td>
            <td className="num">−₹50.01 lakh</td>
          </tr>
          <tr>
            <th scope="row">Loan interest rate</th>
            <td>7.5% to 9.5%</td>
            <td className="num">−₹22.51 lakh</td>
            <td className="num">−₹41.36 lakh</td>
          </tr>
          <tr>
            <th scope="row">Rent increase</th>
            <td>3% to 7%</td>
            <td className="num">−₹36.35 lakh</td>
            <td className="num">−₹26.84 lakh</td>
          </tr>
        </tbody>
      </table>
      <h3>Property appreciation</h3>
      <p>
        Appreciation applies to the full price of the home, not just your down payment, because the loan is a fixed
        amount. Each extra percentage point compounds on the whole value, which is why it often produces the biggest
        swing. It is also the hardest number to predict for a single property.
      </p>
      <h3>Investment return</h3>
      <p>
        This drives the renter&apos;s side. A higher return makes renting look better; a lower one helps buying. Market
        returns are uneven from year to year, so a steady rate is a simplification.
      </p>
      <h3>Price relative to rent, and the loan rate</h3>
      <p>
        The gap between the monthly cost of owning and the rent decides how much the renter can invest each month. A
        higher loan rate widens that gap; a higher rent narrows it. Rent growth matters too, but its effect builds up
        more slowly.
      </p>
      <h3>How long you stay</h3>
      <p>
        Purchase and selling costs are paid once, so a longer stay spreads them over more years. Whether a longer stay
        helps buying overall, though, depends on the other assumptions; in the example above renting stays ahead and
        the gap widens with time. The holding-period table under the calculator shows this directly.
      </p>

      <h2>What the calculator does not include</h2>
      <ul>
        <li>
          <strong>Tax benefits on a home loan.</strong> Under the old tax regime, interest and principal repayment on a
          loan for a self-occupied home may be deductible within limits; the new regime generally does not allow this.
          Including them would improve the buy side for people who claim them.
        </li>
        <li>
          <strong>Other taxes:</strong> tax on investment returns and capital gains tax when the house is sold.
        </li>
        <li>
          <strong>Rent deposit</strong> paid to the landlord and returned at the end.
        </li>
        <li>
          <strong>Moving costs</strong>, furnishing, and repeat brokerage each time a renter changes home.
        </li>
        <li>
          <strong>Home insurance</strong> and major repairs, unless you include them in the yearly ownership costs.
        </li>
        <li>
          <strong>Rental income</strong> if the buyer later lets the property out.
        </li>
        <li>
          <strong>Emotional and security value</strong> of owning, and the flexibility of renting.
        </li>
        <li>
          <strong>Changes in the loan rate</strong> over time. The calculator uses one fixed rate, while most Indian
          home loans are floating.
        </li>
      </ul>

      <h2>When buying tends to look better</h2>
      <p>Within this model, the buy side improves when one or more of these hold:</p>
      <ul>
        <li>The rent for a similar home is high compared with its price, so the monthly gap is small.</li>
        <li>You expect property prices to rise faster than you expect your investments to grow.</li>
        <li>Your loan rate is low, or you can make a large down payment without draining your emergency fund.</li>
        <li>You plan to stay long enough to spread purchase and selling costs over many years.</li>
        <li>You would not invest the monthly saving anyway, so the renter&apos;s advantage would not materialise.</li>
      </ul>

      <h2>When renting tends to look better</h2>
      <ul>
        <li>The home is expensive compared with its rent, so owning costs much more each month.</li>
        <li>You expect your investments to grow faster than property prices.</li>
        <li>Loan rates are high, or purchase and selling costs are a large share of the price.</li>
        <li>You may move within a few years, before one-time costs can be recovered.</li>
        <li>You are disciplined about investing the difference every month.</li>
      </ul>
      <p>
        Before deciding to buy, check what you can comfortably afford with the{" "}
        <Link href="/calculators/home-affordability-calculator">Home Affordability Calculator</Link>, and work out your
        total upfront cash, including stamp duty and registration, with the{" "}
        <Link href="/calculators/property-purchase-cost-calculator">Property Purchase Cost Calculator</Link>.
      </p>
    </CalculatorPageLayout>
  );
}
