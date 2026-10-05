import Link from "next/link";
import { SalaryCalculator } from "@/components/calculators/SalaryCalculator";
import { CalculatorPageLayout, type Source } from "@/components/layout/CalculatorPageLayout";
import { TAX_RULES } from "@/lib/calculations/taxRules";
import { formatDate } from "@/lib/format";
import { buildMetadata, type FaqItem } from "@/lib/seo";

const DESCRIPTION =
  "Convert your CTC to monthly in-hand salary after PF, professional tax and income tax. Compare the new and old tax regimes for FY 2026-27 with a full breakup.";

export const metadata = buildMetadata({
  title: "Salary Calculator – Calculate Take-Home Salary from CTC",
  description: DESCRIPTION,
  path: "/calculators/salary-calculator",
});

const SOURCES: Source[] = [
  { name: TAX_RULES.source.name, url: TAX_RULES.source.url, detail: TAX_RULES.source.detail },
  { name: "EPFO — Employees' Provident Fund Organisation", url: "https://www.epfindia.gov.in", detail: "PF contribution rates and wage ceiling" },
  { name: "State professional tax schedules", detail: "professional tax varies by state; enter the amount on your payslip" },
];

const FAQS: FaqItem[] = [
  {
    question: "How is in-hand salary calculated from CTC?",
    answer:
      "Start with CTC and remove the parts your employer pays on your behalf but does not pay you monthly, such as employer PF and gratuity. That gives gross salary. From gross salary, subtract employee PF, professional tax, income tax (TDS) and any other deductions. Divide the result by 12 for monthly in-hand salary.",
  },
  {
    question: "What is the in-hand salary for a ₹12 lakh CTC?",
    answer:
      "With basic at 40% of CTC, PF at 12% of basic from both employer and employee, and ₹2,400 professional tax, a ₹12 lakh CTC gives about ₹90,200 a month under the new regime. Gross salary is ₹11,42,400 and taxable income ₹10,67,400, so the section 87A rebate brings income tax to nil. Your figure will differ if your structure or PF basis is different.",
  },
  {
    question: "Up to what salary is there no income tax in the new regime?",
    answer:
      "In the new regime, tax is nil if taxable income is ₹12 lakh or less, because of the section 87A rebate. With the ₹75,000 standard deduction, that means gross salary up to ₹12,75,000, provided salary is your only income. Just above ₹12 lakh of taxable income, marginal relief keeps your tax from exceeding the income above ₹12 lakh.",
  },
  {
    question: "Why is my monthly salary less than CTC divided by 12?",
    answer:
      "CTC includes items you do not receive in your monthly pay, such as employer PF, gratuity and sometimes insurance or variable pay. Employee PF, professional tax and TDS are then deducted from gross salary. Together these typically make in-hand pay noticeably lower than CTC ÷ 12.",
  },
  {
    question: "Is PF calculated on full basic or on ₹15,000?",
    answer:
      "Statutory PF is 12% of basic wages (basic plus dearness allowance) up to a wage ceiling of ₹15,000 a month, which is ₹1,800 a month. Many employers contribute 12% of full basic instead. Your offer letter or payslip shows which basis applies. Contributing on full basic lowers take-home today but adds more to your PF balance.",
  },
  {
    question: "Which tax regime gives a higher take-home salary?",
    answer:
      "It depends on your deductions. The new regime has lower rates and a higher standard deduction but allows no HRA exemption, 80C or 80D. The old regime can work out better if your HRA exemption, 80C, 80D and other deductions are large. Enter your deductions in the calculator to compare both on your own figures.",
  },
  {
    question: "Is gratuity part of my in-hand salary?",
    answer:
      "No. When gratuity is included in CTC, it is an amount set aside for you and paid only when you leave after completing the qualifying period of service. It does not appear in monthly pay, so including it in CTC lowers your monthly gross salary.",
  },
];

export default function SalaryCalculatorPage() {
  return (
    <CalculatorPageLayout
      id="salary"
      h1="Salary Calculator: CTC to In-Hand Salary"
      intro={
        <p>
          Find out how much of your CTC reaches your bank account each month. Enter your CTC and salary structure to see
          your monthly take-home after PF, professional tax and estimated income tax, with a full breakup and a new vs old
          regime comparison for {TAX_RULES.taxYear}.
        </p>
      }
      schemaDescription="Converts annual CTC to monthly in-hand salary after employer and employee PF, gratuity, professional tax and estimated income tax under India's new and old tax regimes."
      calculator={<SalaryCalculator />}
      faqs={FAQS}
      sources={SOURCES}
    >
      <h2>CTC vs gross salary vs in-hand salary</h2>
      <p>Three figures describe the same job, and they are rarely the same number:</p>
      <ul>
        <li>
          <strong>CTC (cost to company)</strong> is everything your employer spends on you in a year, including amounts
          you never receive as monthly pay.
        </li>
        <li>
          <strong>Gross salary</strong> is CTC minus employer-side costs such as employer PF and gratuity. It is the
          total of the earnings lines on your payslip.
        </li>
        <li>
          <strong>In-hand (take-home) salary</strong> is gross salary minus employee PF, professional tax, income tax
          (TDS) and any other deductions. It is what is credited to your bank account.
        </li>
      </ul>
      <p className="formula">Gross salary = CTC − employer PF − gratuity (if in CTC)</p>
      <p className="formula">In-hand salary = gross salary − employee PF − professional tax − income tax − other deductions</p>

      <h2>Components of CTC</h2>
      <h3>Basic salary</h3>
      <p>
        Basic is the fixed core of your pay, usually 40–50% of CTC. Many other components are worked out from it, so a
        higher basic raises PF and gratuity and leaves less room for allowances.
      </p>
      <h3>House rent allowance (HRA)</h3>
      <p>
        HRA is commonly 40–50% of basic. It is fully taxable in the new regime. In the old regime, part of it can be
        exempt if you pay rent; the exempt amount depends on rent paid, basic salary and your city, so enter the figure
        from your employer&apos;s tax computation.
      </p>
      <h3>Special allowance</h3>
      <p>
        Special allowance is the balancing figure: whatever remains of gross salary after basic and HRA. It is fully
        taxable.
      </p>
      <h3>Employer PF contribution</h3>
      <p>
        Your employer contributes 12% of basic wages to your EPF account (part of this goes to the pension scheme). The
        statutory minimum is on wages up to ₹15,000 a month, which is ₹1,800 a month, but many employers contribute on
        full basic. When employer PF is shown inside CTC, it reduces your gross salary.
      </p>
      <h3>Gratuity</h3>
      <p>
        Some employers show gratuity in CTC, typically at 4.81% of basic. It is paid only when you leave after
        completing the qualifying service period, so it is not part of your monthly salary.
      </p>

      <h2>Deductions from your salary</h2>
      <ul>
        <li>
          <strong>Employee PF:</strong> 12% of basic (or of basic up to ₹15,000 a month) goes from your salary to your
          EPF account. It is savings, not a cost, but it reduces take-home.
        </li>
        <li>
          <strong>Professional tax:</strong> a state tax on employment, up to ₹2,500 a year. The amount and slabs vary by
          state, and some states do not levy it.
        </li>
        <li>
          <strong>Income tax (TDS):</strong> your employer estimates your tax for the year and deducts it monthly. This
          calculator spreads it evenly over 12 months.
        </li>
      </ul>

      <h2>How income tax is estimated</h2>
      <p>
        The calculator applies the slab rates for {TAX_RULES.taxYear} for a resident individual below 60, last verified
        on {formatDate(TAX_RULES.lastVerified)}. Tax rules change each year, so check the tax year shown above against
        the year you are planning for.
      </p>
      <h3>New regime slabs (default)</h3>
      <table>
        <caption className="sr-only">New tax regime slab rates for {TAX_RULES.taxYear}</caption>
        <thead>
          <tr>
            <th scope="col">Taxable income</th>
            <th scope="col" className="num">
              Rate
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Up to ₹4,00,000</td><td className="num">Nil</td></tr>
          <tr><td>₹4,00,001 – ₹8,00,000</td><td className="num">5%</td></tr>
          <tr><td>₹8,00,001 – ₹12,00,000</td><td className="num">10%</td></tr>
          <tr><td>₹12,00,001 – ₹16,00,000</td><td className="num">15%</td></tr>
          <tr><td>₹16,00,001 – ₹20,00,000</td><td className="num">20%</td></tr>
          <tr><td>₹20,00,001 – ₹24,00,000</td><td className="num">25%</td></tr>
          <tr><td>Above ₹24,00,000</td><td className="num">30%</td></tr>
        </tbody>
      </table>
      <p>
        Salaried people get a standard deduction of ₹75,000. Professional tax, HRA exemption and deductions such as 80C
        and 80D are not allowed in the new regime.
      </p>
      <h3>Old regime slabs</h3>
      <table>
        <caption className="sr-only">Old tax regime slab rates for individuals below 60</caption>
        <thead>
          <tr>
            <th scope="col">Taxable income</th>
            <th scope="col" className="num">
              Rate
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Up to ₹2,50,000</td><td className="num">Nil</td></tr>
          <tr><td>₹2,50,001 – ₹5,00,000</td><td className="num">5%</td></tr>
          <tr><td>₹5,00,001 – ₹10,00,000</td><td className="num">20%</td></tr>
          <tr><td>Above ₹10,00,000</td><td className="num">30%</td></tr>
        </tbody>
      </table>
      <p>
        The old regime has a ₹50,000 standard deduction and allows professional tax, HRA exemption, 80C (up to
        ₹1,50,000 including your employee PF), 80D and other eligible deductions.
      </p>
      <h3>Rebate and marginal relief</h3>
      <p>
        Under the section 87A rebate, tax is nil in the new regime if taxable income is ₹12,00,000 or less (rebate up to
        ₹60,000), and in the old regime if it is ₹5,00,000 or less (rebate up to ₹12,500).
      </p>
      <p>
        In the new regime, marginal relief applies just above ₹12 lakh: tax before cess cannot exceed the income above
        ₹12,00,000. For example, at a taxable income of ₹12,10,000, slab tax would be ₹61,500, but it is limited to
        ₹10,000. Adding 4% cess gives ₹10,400 instead of ₹63,960. This relief stops mattering at about ₹12,70,600 of
        taxable income, where slab tax falls below the income above ₹12 lakh. The old regime has no such relief.
      </p>
      <h3>Surcharge and cess</h3>
      <p>
        A surcharge is added to income tax when taxable income exceeds ₹50 lakh (10%), ₹1 crore (15%) and ₹2 crore
        (25%). In the old regime only, it rises to 37% above ₹5 crore; the new regime caps it at 25%. Marginal relief
        applies at each threshold, so crossing it by a small amount cannot raise tax plus surcharge by more than the
        extra income. Finally, 4% Health and Education Cess is charged on tax plus surcharge.
      </p>

      <h2>New regime vs old regime</h2>
      <p>
        Neither regime is better for everyone. The new regime has lower rates, a higher standard deduction and a larger
        rebate. The old regime has higher rates but lets you reduce taxable income with HRA exemption, 80C, 80D and
        other deductions. If those deductions are small, the new regime usually leaves you with more; if they are large,
        the old regime may. The comparison table under the calculator shows both on your own inputs.
      </p>

      <h2>Worked example: ₹12 lakh CTC</h2>
      <p>
        Using the calculator&apos;s default inputs: basic 40% of CTC, HRA 50% of basic, employer and employee PF at 12%
        of basic, no gratuity in CTC, ₹2,400 professional tax and no other deductions.
      </p>
      <table>
        <caption className="sr-only">Salary breakup for a ₹12 lakh CTC under the new regime</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="num">
              Annual
            </th>
            <th scope="col" className="num">
              Monthly
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td>CTC</td><td className="num">₹12,00,000</td><td className="num">₹1,00,000</td></tr>
          <tr><td>Basic (40% of CTC)</td><td className="num">₹4,80,000</td><td className="num">₹40,000</td></tr>
          <tr><td>Employer PF (12% of basic)</td><td className="num">₹57,600</td><td className="num">₹4,800</td></tr>
          <tr><td>Gross salary (CTC − employer PF)</td><td className="num">₹11,42,400</td><td className="num">₹95,200</td></tr>
          <tr><td>HRA (50% of basic)</td><td className="num">₹2,40,000</td><td className="num">₹20,000</td></tr>
          <tr><td>Special allowance</td><td className="num">₹4,22,400</td><td className="num">₹35,200</td></tr>
          <tr><td>Employee PF</td><td className="num">₹57,600</td><td className="num">₹4,800</td></tr>
          <tr><td>Professional tax</td><td className="num">₹2,400</td><td className="num">₹200</td></tr>
          <tr><td>Income tax (new regime)</td><td className="num">₹0</td><td className="num">₹0</td></tr>
          <tr><td><strong>In-hand salary</strong></td><td className="num"><strong>₹10,82,400</strong></td><td className="num"><strong>₹90,200</strong></td></tr>
        </tbody>
      </table>
      <p>
        <strong>Tax under the new regime:</strong> taxable income = ₹11,42,400 − ₹75,000 = ₹10,67,400. Slab tax is
        ₹20,000 + 10% of ₹2,67,400 = ₹46,740, which the rebate cancels because taxable income is below ₹12 lakh.
      </p>
      <p>
        <strong>Tax under the old regime, with no deductions beyond PF:</strong> taxable income = ₹11,42,400 − ₹50,000
        standard deduction − ₹2,400 professional tax − ₹57,600 employee PF under 80C = ₹10,32,400. Tax = ₹12,500 +
        ₹1,00,000 + 30% of ₹32,400 = ₹1,22,220, plus 4% cess = ₹1,27,109. Monthly take-home would be about ₹79,608, so
        on these inputs the new regime leaves about ₹10,592 a month more.
      </p>

      <h2>Take-home at common CTC levels</h2>
      <p>Same structure as the worked example, new regime:</p>
      <table>
        <caption className="sr-only">Estimated monthly take-home and annual income tax by CTC, new regime</caption>
        <thead>
          <tr>
            <th scope="col">Annual CTC</th>
            <th scope="col" className="num">
              Monthly take-home
            </th>
            <th scope="col" className="num">
              Annual income tax
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td>₹6 lakh</td><td className="num">₹45,000</td><td className="num">₹0</td></tr>
          <tr><td>₹10 lakh</td><td className="num">₹75,133</td><td className="num">₹0</td></tr>
          <tr><td>₹15 lakh</td><td className="num">₹1,05,611</td><td className="num">₹86,268</td></tr>
          <tr><td>₹25 lakh</td><td className="num">₹1,64,192</td><td className="num">₹2,87,300</td></tr>
          <tr><td>₹50 lakh</td><td className="num">₹2,91,057</td><td className="num">₹10,24,920</td></tr>
        </tbody>
      </table>
      <p>
        Once you know your monthly take-home, you can check how much home loan a lender may offer with the{" "}
        <Link href="/calculators/home-loan-eligibility-calculator">home loan eligibility calculator</Link>, work out a
        comfortable property budget with the{" "}
        <Link href="/calculators/home-affordability-calculator">home affordability calculator</Link>, or see what a
        monthly investment from your salary could grow to with the <Link href="/calculators/sip-calculator">SIP calculator</Link>.
      </p>

      <h2>Why your payslip may differ</h2>
      <ul>
        <li>Your employer may split CTC differently, with components such as LTA, meal cards, fuel or telephone reimbursements.</li>
        <li>Variable pay, bonuses and joining bonuses are often in CTC but paid once a year or on conditions.</li>
        <li>Employer insurance premiums, NPS contributions and other benefits may be included in CTC.</li>
        <li>Your employer recalculates TDS during the year based on the regime you choose and the proofs you submit, so monthly TDS is rarely identical every month.</li>
        <li>Professional tax is deducted on state-specific slabs, sometimes with a higher amount in one month.</li>
        <li>Other income, such as interest, rent or capital gains, changes your total tax but is not included here.</li>
      </ul>
    </CalculatorPageLayout>
  );
}
