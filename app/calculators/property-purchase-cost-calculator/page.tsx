import Link from "next/link";
import { PropertyPurchaseCostCalculator } from "@/components/calculators/PropertyPurchaseCostCalculator";
import { CalculatorPageLayout, type Source } from "@/components/layout/CalculatorPageLayout";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Work out the total cost of buying a home in India: stamp duty, registration, GST, brokerage, loan fees and the real cash you need beyond the down payment.";

export const metadata = buildMetadata({
  title: "Property Purchase Cost Calculator – Total Cost of Buying a Home",
  description: DESCRIPTION,
  path: "/calculators/property-purchase-cost-calculator",
});

const FAQS: FaqItem[] = [
  {
    question: "How much cash do I need to buy a house in India apart from the down payment?",
    answer:
      "On top of the down payment you usually pay stamp duty, registration charges, GST if the home is under construction, brokerage if you use an agent, legal fees, society deposits and loan processing charges. Together these often add several per cent of the property price. Enter your own figures in the calculator to see the total for your purchase.",
  },
  {
    question: "Why doesn't the calculator include my state's stamp duty rate automatically?",
    answer:
      "Stamp duty and registration are set by each state and can differ by city or area, property value, property type and sometimes buyer category, and they are revised from time to time. Rather than risk showing an outdated rate, the calculator asks you to enter the rate from your state's registration department or your builder's cost sheet. The default values are examples only.",
  },
  {
    question: "Is stamp duty charged on the agreement value or the circle rate?",
    answer:
      "In most states, stamp duty is charged on the higher of the agreement value and the government's circle rate or guidance value for that area. If the guidance value is higher than your purchase price, tick 'Use a different value for stamp duty' and enter it.",
  },
  {
    question: "Is GST payable on a ready-to-move flat?",
    answer:
      "No. GST applies to under-construction property. A ready-to-move home sold after the completion or occupancy certificate is issued does not attract GST. For under-construction residential flats, GST is generally 5% without input tax credit, or 1% for affordable housing.",
  },
  {
    question: "Can I include stamp duty and registration in my home loan?",
    answer:
      "Usually not. Lenders typically finance a share of the property value and exclude stamp duty and registration charges, so you should plan to pay them from your own savings along with the down payment. Check your lender's policy.",
  },
  {
    question: "Are women buyers charged lower stamp duty?",
    answer:
      "Some states offer a lower stamp duty rate when the property is registered in a woman's name, either alone or jointly. The concession and its conditions vary by state, so check your state's current rules and enter the rate that applies to you.",
  },
];

const SOURCES: Source[] = [
  {
    name: "CBIC – GST rates for residential construction services (Notification 03/2019-Central Tax (Rate))",
    url: "https://cbic-gst.gov.in",
    detail: "basis for the 5% / 1% GST rule on under-construction homes; checked 6 October 2026",
  },
  { name: "Your state's Department of Registration and Stamps (IGR)", detail: "current stamp duty and registration rates" },
  { name: "Indian Stamp Act, 1899 and state stamp acts", detail: "legal basis for stamp duty on property transfers" },
];

export default function PropertyPurchaseCostCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="property-purchase-cost"
      h1="Property Purchase Cost Calculator"
      intro={
        <p>
          The price of a home is only part of what you pay. Enter your state&apos;s stamp duty and registration rates,
          other fees and your loan to see the <strong>total cash you need upfront</strong> and the full cost of buying.
        </p>
      }
      schemaDescription={DESCRIPTION}
      calculator={<PropertyPurchaseCostCalculator />}
      faqs={FAQS}
      sources={SOURCES}
    >
      <h2>What it really costs to buy a home in India</h2>
      <p>
        When you agree a price with a builder or seller, that figure is the starting point. Before you get the keys you
        will usually also pay government charges (stamp duty and registration), GST if the home is under construction,
        and a set of smaller costs: brokerage, legal fees, society deposits and home loan charges. Most of this is due
        around the time of registration, and most of it has to come from your own savings.
      </p>
      <p>The calculator adds these up as follows:</p>
      <p className="formula">Extra costs = stamp duty + registration + GST + brokerage + legal + society + other + loan charges</p>
      <p className="formula">Total upfront cash = (property price − loan amount) + extra costs</p>
      <p className="formula">Total purchase cost = property price + extra costs</p>
      <p>The total purchase cost does not include interest on the home loan.</p>

      <h2>Stamp duty</h2>
      <p>
        Stamp duty is a tax on the document that transfers ownership — the sale deed or conveyance deed. It is levied
        under the Indian Stamp Act, 1899 and each state&apos;s own stamp law, and the rate is set by the state
        government. That is why it differs from one state to the next, and sometimes between cities, urban and rural
        areas, property value bands and property types.
      </p>
      <h3>The value it is charged on</h3>
      <p>
        Duty is usually charged on the higher of the agreement value and the government&apos;s circle rate (also called
        guidance value or ready reckoner rate) for that location. If the circle rate for your property is higher than
        the price you are paying, use the &ldquo;Value used for stamp duty&rdquo; option so the estimate reflects it.
      </p>
      <h3>Concessions</h3>
      <p>
        Some states charge a lower rate in certain cases — for example, when the home is registered in a woman&apos;s
        name. These concessions, and their conditions, change over time, so confirm what applies to you before relying
        on a rate.
      </p>

      <h2>Registration charges</h2>
      <p>
        Registration charges are paid to the sub-registrar&apos;s office to record the sale deed in government records.
        Many states charge a percentage of the property value, some charge a fixed amount, and some cap the fee at a
        maximum. The calculator lets you enter a percentage or a fixed amount, plus an optional cap.
      </p>

      <h2>GST on under-construction property</h2>
      <p>
        Under CBIC&apos;s rate notification for residential construction (Notification 03/2019-Central Tax (Rate)),
        under-construction residential flats generally attract GST of <strong>5%</strong> without input tax credit, and{" "}
        <strong>1%</strong> for homes that qualify as affordable housing. A ready-to-move home sold after the
        completion or occupancy certificate is issued has <strong>no GST</strong>. GST is not charged on resale homes
        bought from an individual owner either.
      </p>
      <p>
        If you pay part of the price before completion and part after, GST may apply only to the instalments paid
        before the certificate. The builder&apos;s invoice is the final word, so check it.
      </p>
      <p className="text-sm text-ink-muted">
        Last updated <time dateTime="2026-10-06">6 October 2026</time>. GST rule per CBIC; all rates in the calculator
        are entered by you.
      </p>

      <h2>Brokerage, legal and society charges</h2>
      <ul>
        <li>
          <strong>Brokerage</strong> is negotiable and is often around 1–2% of the price when an agent is involved. GST
          is charged on brokerage, so enter the rate inclusive of GST. Buying directly from a builder may involve no
          brokerage.
        </li>
        <li>
          <strong>Legal and documentation fees</strong> cover title checks, drafting and reviewing the agreement and
          sale deed, and help with registration.
        </li>
        <li>
          <strong>Society charges</strong> can include an advance maintenance deposit, a corpus fund, membership fees
          and, for resale flats, a transfer fee.
        </li>
        <li>
          <strong>Other charges</strong> such as parking, club membership and preferential location charges (PLC) are
          sometimes billed separately from the base price. Add them only if they are not already in your agreement value.
        </li>
      </ul>

      <h2>Home loan costs</h2>
      <p>
        Lenders usually charge a <strong>processing fee</strong>, either a percentage of the loan or a flat amount, plus
        GST. You may also pay for the lender&apos;s <strong>legal and technical verification</strong> of the property.
        In some states, creating the lender&apos;s mortgage by deposit of title deeds (<strong>MODT</strong>) attracts a
        separate stamp duty; whether it applies, and how much, depends on your state. If you choose to pay a home loan
        insurance premium upfront, include it too. Put these under &ldquo;Other loan charges&rdquo;.
      </p>

      <h2>Worked example: a ₹1 crore home</h2>
      <p>
        Take a ready-to-move flat priced at ₹1 crore, bought with a ₹75 lakh home loan, using the calculator&apos;s
        default example rates. These rates are illustrative only; your state&apos;s figures will differ.
      </p>
      <table>
        <caption className="sr-only">Purchase costs for a ₹1 crore ready-to-move home with a ₹75 lakh loan</caption>
        <tbody>
          <tr>
            <th scope="row">Property price</th>
            <td className="num">₹1,00,00,000</td>
          </tr>
          <tr>
            <th scope="row">Stamp duty (example 6%)</th>
            <td className="num">₹6,00,000</td>
          </tr>
          <tr>
            <th scope="row">Registration (example 1%)</th>
            <td className="num">₹1,00,000</td>
          </tr>
          <tr>
            <th scope="row">GST (ready to move)</th>
            <td className="num">₹0</td>
          </tr>
          <tr>
            <th scope="row">Brokerage (1%)</th>
            <td className="num">₹1,00,000</td>
          </tr>
          <tr>
            <th scope="row">Legal and documentation</th>
            <td className="num">₹25,000</td>
          </tr>
          <tr>
            <th scope="row">Society deposit and transfer</th>
            <td className="num">₹1,00,000</td>
          </tr>
          <tr>
            <th scope="row">Loan processing fee (0.5% of ₹75 lakh)</th>
            <td className="num">₹37,500</td>
          </tr>
          <tr>
            <th scope="row">Total extra costs</th>
            <td className="num">₹9,62,500</td>
          </tr>
          <tr>
            <th scope="row">Down payment (₹1 crore − ₹75 lakh)</th>
            <td className="num">₹25,00,000</td>
          </tr>
          <tr>
            <th scope="row">Total upfront cash</th>
            <td className="num">₹34,62,500</td>
          </tr>
          <tr>
            <th scope="row">Total purchase cost (excluding loan interest)</th>
            <td className="num">₹1,09,62,500</td>
          </tr>
        </tbody>
      </table>
      <p>
        The extra costs come to about 9.6% of the price, so you need roughly ₹34.6 lakh in cash — not just the ₹25 lakh
        down payment. If the same flat were under construction at 5% GST, another ₹5,00,000 would be added, taking the
        upfront cash to ₹39,62,500.
      </p>

      <h2>Why these costs usually cannot be funded by the loan</h2>
      <p>
        Lenders typically finance a share of the property&apos;s value — under RBI guidelines, generally up to 75–90%
        depending on the loan size — and usually exclude stamp duty and registration from that value. Brokerage, legal
        fees, deposits and loan charges are also normally paid by you. So the cash you need is the down payment{" "}
        <em>plus</em> nearly all of these costs. Use the{" "}
        <Link href="/calculators/home-loan-eligibility-calculator">home loan eligibility calculator</Link> to see how
        much you may be able to borrow, and the{" "}
        <Link href="/calculators/home-affordability-calculator">home affordability calculator</Link> to work out a
        realistic price range from your income and savings.
      </p>

      <h2>How to get exact figures</h2>
      <ul>
        <li>
          Check current stamp duty and registration rates on your state&apos;s Department of Registration and Stamps
          (IGR) website, including any concession you may qualify for.
        </li>
        <li>Look up the circle rate or guidance value for the property&apos;s location on the same website.</li>
        <li>Ask the builder for a written cost sheet listing every charge, with GST shown separately.</li>
        <li>Ask your lender for a schedule of processing, legal, technical and other loan charges.</li>
        <li>Agree brokerage in writing before you start viewing properties.</li>
      </ul>
      <p>
        Once you know the cash you need, the{" "}
        <Link href="/calculators/home-loan-calculator">home loan calculator</Link> shows the EMI and total interest on
        the loan, and the <Link href="/calculators/rent-vs-buy-calculator">rent vs buy calculator</Link> helps you
        compare buying with continuing to rent and investing the difference.
      </p>
    </CalculatorPageLayout>
  );
}
