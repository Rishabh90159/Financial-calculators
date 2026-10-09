# MoneyMetric SEO audit and keyword opportunity report

**Date:** 9 October 2026 · **Site:** https://www.moneymetric.in · **Scope:** 12 live calculators, 20 indexable URLs

Companion data: [`competitor-keywords-classified.csv`](./competitor-keywords-classified.csv). It has all 400 competitor rows with normalized numbers, cluster, intent, a branded flag, relevance and the MoneyMetric target URL.

Labels used below: **[Fact]** = verified in code, the build or on the live site. **[Data]** = taken from the supplied exports, which are third-party *estimates*. **[Rec]** = recommendation.

---

## 0. Method and data caveats

- **Sources:** four exports, 100 rows each (400 total), all read:
  - `export_data (8).xlsx`: ET Money salary calculator
  - `export_data (7).xlsx`: sipcalculator.in
  - `export_data (6).xlsx`: HDFC home loan eligibility
  - `export_data (5).xlsx`: HDFC home loan EMI
- **Normalization:** "1.1M", "16.3K" and similar became integers. A position of "-" means the competitor does not rank; the keyword is still a valid demand signal.
- **Uniqueness:** there are **377 unique keywords**. **23 appear in both HDFC reports**, for example "home loan calculator" at position 1 on one HDFC URL and position 6 on the other. Cluster volumes below count each keyword once. Competitor traffic is **never summed across reports**, and it is not MoneyMetric traffic.
- **Exclusions:** 297 keywords are relevant non-branded opportunities. The rest were excluded:
  - 61 competitor-branded (HDFC, SBI, Groww, ET Money, ClearTax, sipcalculator.in)
  - 7 non-English
  - live home loan interest rates
  - loan application terms
  - land/plot loans
  - unsupported SIP topics (bitcoin, Nifty, index fund)
  - ambiguous terms such as "per month"
- **Coverage gap:** the exports show only what *these four competitor URLs* rank for. They are not a full market keyword universe. Volumes are tool estimates for India.

## 1. Confirmed technical SEO findings

The technical foundation is strong. Everything below was checked on the live site and on a local production build.

| Check | Result |
|---|---|
| Framework / rendering | **[Fact]** Next.js 16 App Router; every route is statically prerendered (`○ Static`). All article content, FAQs and tables are in the server HTML. Only the calculator widget hydrates. |
| robots.txt | **[Fact]** `Allow: /` plus a sitemap line in production. Preview and dev builds are `Disallow: /` and `noindex`. This is correct. |
| Sitemap | **[Fact]** Contains all 20 indexable URLs; registry-driven; planned calculators are excluded. |
| Canonicals | **[Fact]** Every page has a self-referencing absolute canonical on `https://www.moneymetric.in`. |
| Titles / descriptions | **[Fact]** Unique on all crawled pages; no duplicates (verified by crawl). |
| H1 | **[Fact]** Exactly one per page. |
| Meta robots | **[Fact]** `index, follow` on all pages; the 404 page is `noindex`. |
| Status codes | **[Fact]** 21 internal URLs crawled, all 200, no broken internal links. Unknown paths return 404. Trailing slash and non-www both 308 to the canonical URL. |
| Structured data | **[Fact]** Organization, WebSite, WebApplication, BreadcrumbList and FAQPage. All JSON-LD parses, FAQ schema is generated from the same array as the visible FAQs, and there are no ratings or review markup. |
| Orphans / navigation | **[Fact]** None. The header, footer, directory and "related calculators" sections all come from one registry. |
| **Issue: redirect chain** | **[Fact]** `http://moneymetric.in/*` → `https://moneymetric.in/*` → `https://www.moneymetric.in/*` takes **2 hops**. This is a hosting/domain setting; see §8. |
| **Issue: identical lastmod** | **[Fact]** Every calculator shared one global `lastmod`, so editing one page would date them all. **Fixed:** each calculator now has its own date. |
| **Issue: title length** | **[Fact]** Titles run 64–82 characters including " \| MoneyMetric", so Google will usually truncate the brand suffix. The keyword-bearing part comes first, so this is low risk; no change made. |
| Core Web Vitals | **[Rec]** Pages are static with no third-party scripts apart from opt-in analytics, and fonts use `display: swap`. I could not measure field data, so check CrUX / Search Console (§8). |

## 2. Content accuracy findings (fixed)

- **Labour Codes:** **[Fact]** The salary page said basic pay is "usually 40–50% of CTC". It did not mention the Code on Wages' 50% wage rule, in force since 21 November 2025, which raises PF and gratuity for many employees.
  - **Fixed:** the page now explains the rule, shows its effect (₹12 L CTC: about ₹90,200 → ₹87,800 a month at 50% basic), and adds an FAQ.
  - The calculator default stays at 40% so the existing examples and tests remain valid. See §8 for whether to change it.
- **Income-tax Act, 2025:** **[Fact]** From 1 April 2026 the 2025 Act replaces the 1961 Act and renumbers sections; secondary sources say 87A becomes 156.
  - **Fixed:** added a note that rates are unchanged and that the page keeps the familiar section names.
  - **[Rec]** Confirm the official section mapping before quoting new section numbers anywhere.
- **Inflation reference:** **[Fact]** RBI's CPI target of 4% (2–6% band) was renewed for April 2026 – March 2031 (DEA notification, March 2026). The new SIP inflation input cites this target.

## 3. Top keyword opportunities

Priorities weigh relevance, difficulty (KD), volume and how well an existing MoneyMetric page already fits. Volume and KD are **[Data]**.

| # | Cluster | Primary keyword | Vol / KD | Why this priority |
|---|---|---|---|---|
| P0 | In-hand salary | **in hand salary calculator** (+ "inhand", 16.3K / KD 11) | 24.4K / 11 | Large volume at very low KD, and the existing page is already strong. The title lacked "in-hand". |
| P0 | SIP with inflation / step-up | **sip calculator with inflation** | 11.2K / 39 | The cluster totals about 16.3K at weighted KD 32. MoneyMetric had **no inflation or step-up feature**, so this was a real functional gap. |
| P0 | Salary by CTC (LPA) | 25 lpa in hand salary; 4 lakh per annum in month; 26 LPA; 15 CTC | 2.7K / 4; 2.6K / 4 | KD 4–6. These are answered by a table plus FAQs on the existing page. |
| P1 | Home loan eligibility by salary | **home loan eligibility calculator** | 16.3K / 43 | The long tail ("on 40000 salary", 612 / KD 17; 20K–50K salaries) was missing below ₹50K. |
| P1 | Loan prepayment | **home loan prepayment calculator** | 6K / 31 | Lowest KD among the loan terms; HDFC ranks only #5. The title did not say "home loan". |
| P1 | Amount-specific EMI | 20 / 30 lakh home loan emi | 4K / 38; 3.9K / 48 | Quick-answer intent; a table plus FAQ covers it. |
| P1 | Mutual fund returns | mutual fund return calculator; mutual funds calculator | 14.2K / 15; 9K / 4 | Low KD, but the SERP likely expects a **lump-sum mode**, which MoneyMetric lacks (§9). |
| P2 | Home loan EMI head | home loan emi calculator | 226.4K / 55 | Well served already; it is a high-KD bank-dominated SERP, so gains will be slow. |
| P2 | Generic EMI | emi calculator; loan emi calculator | 1.7M / 51; 165K / 50 | Highly competitive; titles were refined only. |
| P2 | Personal loan | personal loan calculator | 113.2K / 56 | Maps to `/loan-calculator`; the title now leads with it. |
| P2 | Salary reverse | monthly salary to ctc calculator | 1.3K / 10 | Needs a new **feature** (in-hand → CTC solver), not a new page. |
| P3 | Home loan calculator head | home loan calculator | 284.5K / 61 | Very hard. The current page is differentiated (price → LTV → cash), so no change. |
| P3 | Tenure solver | home loan tenure calculator | 1.3K / 54 | Would need a "solve for tenure" mode. |
| Excluded | Interest rates | home loan interest rate | 79.5K / 50 | Needs live, maintained lender rates; there is a risk of publishing outdated rates. |
| Excluded | Branded / non-English | hdfc home loan calculator, groww login, सैलरी कैलकुलेटर … | — | Competitor brands are not legitimate targets; there are no Hindi pages. |

## 4. Keyword-to-URL mapping

| URL | Search intent (one per page) | Primary | Secondary (from the data) | Competitor evidence [Data] |
|---|---|---|---|---|
| `/calculators/salary-calculator` | Take-home pay from CTC | in hand salary calculator | inhand salary calculator, salary calculator (india), ctc to in-hand salary calculator, in hand salary calculator after tax, take home salary calculator india, new tax regime salary calculator, 25 lpa in hand salary | ET Money is #1 for most |
| `/calculators/sip-calculator` | Projected SIP growth | sip calculator | sip return(s) calculator, sip calculator with inflation, inflation adjusted sip calculator, step up, monthly sip calculator, mutual fund return calculator, sip return rate | sipcalculator.in #2–#11 |
| `/calculators/emi-calculator` | EMI for any loan | emi calculator | loan emi calculator, emi calculator online, emi calculation, emi calculator in months | HDFC #1–#5 |
| `/calculators/home-loan-emi-calculator` | Mortgage EMI and amortization | home loan emi calculator | emi calculator for home loan, housing / house loan emi calculator, home loan repayment calculator, 20 / 25 / 30 / 50 lakh home loan emi, mortgage loan emi calculator | HDFC #1 |
| `/calculators/home-loan-calculator` | Price → down payment, LTV, cash | home loan calculator | emi calculator with down payment, house loan calculator | HDFC #1 |
| `/calculators/home-loan-eligibility-calculator` | Borrowing capacity | home loan eligibility calculator | loan eligibility calculator, home loan eligibility based on salary, how much home loan can i get (on X salary), home loan maximum tenure, home loan age limit | HDFC #1 |
| `/calculators/home-affordability-calculator` | Comfortable budget | home affordability calculator | home loan affordability calculator | HDFC #3 |
| `/calculators/loan-prepayment-calculator` | Interest / tenure saved | home loan prepayment calculator | emi calculator with prepayment, home loan emi calculator with prepayment | HDFC #1–#5 |
| `/calculators/loan-calculator` | Cost of non-home loans | personal loan calculator | loan interest calculator, bank loan interest calculator, loan calculation | HDFC #1–#2 |
| `/calculators/rent-vs-buy-calculator`, `/property-purchase-cost-calculator` | Unchanged | — | No matching demand in these four exports | — |

**Cannibalization review:** EMI, Home Loan EMI and Home Loan Calculator overlap in formula, but each page has a distinct starting input and question, and they cross-link with explicit "use this one if…" guidance. Eligibility and Affordability are explicitly contrasted on both pages. **[Rec]** Consolidating or redirecting URLs is not justified.

## 5. Changes made, page by page

| Page | Changes |
|---|---|
| **SIP** | **New feature:** optional *annual step-up %* and *expected inflation %*, both default 0, so default results are unchanged. Shows "value in today's money". New title and meta; new H2s "Step-up SIP" and "SIP calculator with inflation" with formula and verified tables; a "Small SIPs add up too" table (₹1,000 × 5 yrs = ₹82,486); 4 new FAQs (SIP "interest rate", inflation, step-up, ₹1,000 × 5 yrs); Sources section (DEA inflation target, SEBI); contextual links to the salary, prepayment and rent vs buy calculators. |
| **Salary** | Title now leads with "In-Hand Salary Calculator India … (FY 2026-27)"; new meta; Labour Codes 50% wage-rule paragraph; Income-tax Act 2025 note; the LPA table grows from 5 to 10 rows (₹4 L – ₹50 L); 3 new FAQs (25 LPA, 4 LPA per month, Labour Codes); Ministry of Labour source added. |
| **Home loan eligibility** | Salary table extended to ₹20K / ₹25K / ₹30K / ₹40K; clarified the 90% LTV slab under ₹30 L; 3 new FAQs (₹40K salary, maximum tenure / age, minimum salary). |
| **Home loan EMI** | Title "Housing Loan EMI & Repayment Schedule"; meta; ₹20 L and ₹30 L rows added; ₹30 L FAQ; "housing loan" in the intro; descriptive anchor to the **home loan prepayment calculator**. |
| **Loan prepayment** | Title "Home Loan Prepayment Calculator – Interest & Tenure Savings"; meta. H1 and URL unchanged. |
| **Loan** | Title "Loan Calculator – Personal Loan EMI, Interest & Total Cost". |
| **EMI** | Title "EMI Calculator – Loan EMI, Interest & Amortization Schedule"; meta. |
| **Home affordability** | Meta now names "home loan affordability calculator". |
| **Methodology** | Documents the step-up and inflation formulas. |
| **Sitemap / "Last reviewed"** | Per-calculator `contentUpdated`. Only the 4 substantively edited pages show 2026-10-09; the others keep 2026-10-06. |

Every new number on these pages was computed with the site's own calculation engines, not by hand. The existing ₹25 L and ₹50 L EMI rows matched exactly.

## 6. Files modified

| File | Reason |
|---|---|
| `lib/calculations/sip.ts` | Optional `annualStepUp` / `inflationRate`; new `stepUpSipValue`, `inflationAdjusted`. The closed-form path is unchanged when step-up = 0. |
| `lib/calculations/__tests__/sip.test.ts` | 8 new tests, including an independent year-block derivation that cross-checks the step-up simulation. |
| `components/calculators/SipCalculator.tsx` | Two optional inputs and a "value in today's money" result. |
| `app/calculators/{sip,salary,home-loan-eligibility,home-loan-emi}-calculator/page.tsx` | Content, metadata and FAQs as above. |
| `app/calculators/{emi,loan,loan-prepayment,home-affordability}-calculator/page.tsx` | Title and meta only. |
| `app/methodology/page.tsx` | Method disclosure for the new SIP inputs. |
| `lib/calculators/registry.ts` | `contentUpdated` field; SIP description; SIP related links (now includes salary). |
| `app/sitemap.ts`, `components/layout/CalculatorPageLayout.tsx` | Use the per-page date. |
| `docs/seo/*` | This report and the classified keyword CSV. |

**New pages created: none.** Every opportunity mapped to an existing URL, and no thin keyword-variant pages were added.

## 7. Test results (all executed)

| Check | Before | After |
|---|---|---|
| `npm test` (Vitest) | 289 / 289 passed | **297 / 297 passed** |
| `npm run lint` | clean | **clean** |
| `npm run typecheck` | clean | **clean** |
| `npm run build` | — | **success, 26 static routes** |
| Local production crawl (sitemap + every internal link) | — | **21 URLs, all 200; 0 broken links, duplicate titles or descriptions, or noindex pages; 1 H1 per page; all JSON-LD valid; canonicals self-referencing** |
| New content present in server HTML | — | **verified** for all 4 edited pages, including the new FAQ schema entries |

Reference checks for the new formulas:
- **Inflation:** ₹23,23,391 ÷ 1.06¹⁰ = ₹12,97,369.
- **Step-up:** the month-by-month simulation equals an independent closed-form year-block sum (₹33,74,326 for ₹10K, 12%, 10% step-up, 10 years).
- **No regression:** step-up 0% reproduces the existing ₹23,23,391.

**Not done:** no browser or visual QA of the two new SIP inputs at mobile width, and no Lighthouse run.

## 8. Manual tasks (need external access)

1. **Vercel → Domains:** make `moneymetric.in` redirect straight to `https://www.moneymetric.in` so the HTTP apex takes one hop instead of two.
2. **Search Console:**
   - Resubmit the sitemap.
   - Request indexing for the 4 edited URLs.
   - After 4–6 weeks, compare impressions and CTR for "in hand salary calculator", "sip calculator with inflation", "home loan prepayment calculator" and "home loan eligibility calculator".
3. **Search Console → Core Web Vitals / CrUX:** confirm field LCP, INP and CLS (not measurable here).
4. **Rich Results Test:** spot-check one calculator URL. FAQPage markup is valid, but Google shows FAQ rich results only for limited site types, so expect no visual SERP change.
5. **Decision needed:** should the salary calculator's default basic pay move from 40% to 50% to reflect the Labour Codes? This changes the headline numbers, the worked examples and the reference tests.
6. **Verify** the official Income-tax Act 2025 section numbering before using new section numbers anywhere.

## 9. Prioritized 30-day plan

| Week | Priority | Action |
|---|---|---|
| 1 | P0 | Deploy this change set; do tasks 1–2 in §8; QA the SIP inputs on mobile. |
| 1 | P0 | Decide on the 40% vs 50% basic default (§8.5). |
| 2 | P1 | **Lump-sum mode on the SIP calculator** (tab: SIP / Lump sum). Targets "mutual fund return calculator" (14.2K / KD 15), "mutual funds calculator" (9K / KD 4) and "mf calculator" (15.3K / KD 40) on the existing URL. |
| 2 | P1 | In-hand → CTC reverse mode on the salary calculator ("monthly salary to ctc calculator", 1.3K / KD 10). |
| 3 | P2 | "Solve for tenure" option on the EMI calculators (home loan / loan tenure calculator, about 2.8K combined). |
| 3 | P2 | Internal-link pass: add descriptive links to the salary and SIP pages from the eligibility and affordability pages. |
| 4 | P2 | Review Search Console query data: keep titles that lift CTR and revert those that don't. Expand FAQs only where real queries appear. |
| Later | P3 | Hindi versions (सैलरी कैलकुलेटर 13.2K, सिप कैलकुलेटर 2.3K) need `hreflang`, translated content and maintenance; consider only with editorial capacity. |

No ranking or traffic outcome is guaranteed. These changes improve relevance, coverage of real queries and crawlability; results depend on competition and Google's evaluation over time.
