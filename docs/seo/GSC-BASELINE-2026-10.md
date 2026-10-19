# Search Console baseline and follow-up audit: priority loan pages

**Date:** 18 October 2026 · **Baseline window:** GSC, 8–14 October 2026 · **Companion:** [SEO-AUDIT-2026-10.md](./SEO-AUDIT-2026-10.md)

## 1. Baseline (small sample)

The site-level chart for the week shows about 167 impressions and 4 clicks. None of the priority pages below received a meaningful number of clicks.

| Page | Impressions | Avg. position |
|---|---|---|
| `/calculators/home-loan-emi-calculator` | 90 | 86.53 |
| `/calculators/home-loan-eligibility-calculator` | 54 | 84.17 |
| `/calculators/loan-prepayment-calculator` | 7 | 107.14 |
| `/calculators/loan-calculator` | 6 | 94.17 |
| `/calculators/home-loan-calculator` | 2 | 66.00 |

**Reading the baseline.** The first deploy was on 5 October 2026, so the site was 3–9 days old during this window. The 9 October content release also landed partway through it. Positions of 65–107 on a new domain, against bank-dominated results for terms such as "home loan emi calculator", mostly reflect the domain's lack of history and links. They do not point to missing content. Do not judge the effect of any page change on this week's data.

## 2. Audit findings (code, build and live site)

- **Indexability:** all five pages return 200 with `index, follow` and a self-referencing canonical on `https://www.moneymetric.in`. All are in the sitemap, which lists 20 URLs, and none are blocked by robots.txt.
- **Rendering:** pages are statically prerendered. The article, FAQs and the calculator's default result (for example ₹43,391 on the EMI page) are in the server HTML.
- **Structure:** each page has one H1. JSON-LD (WebApplication, FAQPage, BreadcrumbList, Organization, WebSite) parses, and the FAQ schema matches the visible FAQs.
- **Calculations:** every figure quoted on the five pages was recomputed with the site's engines and matches. That covers the EMI tables, the rate and tenure tables, the eligibility tables and worked example, the prepayment scenarios and the personal-loan table. Vitest: 297/297.
- **Mobile:** article tables scroll within their own container, so the page itself never scrolls sideways.
- **Redirects:** www, trailing slash and https each take one 308. **`http://moneymetric.in` still takes two hops** (see §4).
- **Intent overlap:** the EMI, Home Loan EMI and Home Loan Calculator pages share a formula but start from different questions, and the pages cross-link and the hub explains the difference. Watch for page switching in Search Console (§5) before considering any consolidation.

## 3. Changes in this release

| File | Change | Reason |
|---|---|---|
| `app/calculators/home-loan-emi-calculator/page.tsx` | Title is now "Home Loan EMI Calculator India – Monthly EMI & Interest" (was 78 characters, now 68 with the brand). New meta description and a clearer intro. New "Assumptions and limitations" section. Two FAQs added: why bank EMIs differ, and pre-EMI. | The title now matches "monthly EMI" intent without repeating "loan EMI", and it fits before truncation. The rounding, disbursement and floating-rate assumptions were not stated on the page. Pre-EMI is a home-loan question no page answered. |
| `app/calculators/home-loan-eligibility-calculator/page.tsx` | Title is now "…– Check Loan Amount by Salary". Added a contextual link to the Home Loan Calculator. | The old title repeated "Eligibility". The page did not link to the price → down payment tool. |
| `app/calculators/loan-calculator/page.tsx` | Link to the loan prepayment calculator from the existing prepayment tip. | Helps users act on the tip. |
| `lib/calculators/registry.ts` | `contentUpdated` for Home Loan EMI is 2026-10-18. | Its sitemap `lastmod` reflects the real content change. The other pages changed only in title or a link, so their dates are unchanged. |

No formulas, calculator behaviour or URLs changed.

### 3a. Title-length fix (19 October 2026)

A site scan of the live site flagged "Title too long" (over 70 characters) on 11 pages. A live re-crawl confirmed exactly those 11 URLs, at 72–77 characters. The scanner counts decoded characters, " | MoneyMetric" included, with `&` as one character; the 69-character Home Loan EMI title was not flagged.

| Page | Before | After |
|---|---|---|
| SIP | 77 · SIP Calculator – SIP Return Calculator with Step-Up & Inflation | 63 · SIP Calculator – Returns with Step-Up & Inflation |
| Property purchase cost | 77 · …– Total Cost of Buying a Home | 66 · …– Stamp Duty, Fees |
| Salary | 77 · In-Hand Salary Calculator India – CTC to Take-Home (FY 2026-27) | 69 · In-Hand Salary Calculator – CTC to Take-Home FY 2026-27 |
| Home loan eligibility | 76 · …– Check Loan Amount by Salary | 62 · Home Loan Eligibility Calculator Based on Salary |
| Rent vs buy | 76 · …– Compare the Cost of Renting vs Buying | 62 · …– Should You Rent or Buy? |
| Car loan | 75 · …– Calculate EMI, Interest & Total Payment | 62 · …– EMI, Interest & Total Cost |
| Calculators hub | 74 · All Financial Calculators – Loans, Home Buying, SIP & Salary | 64 · All Calculators – Loans, Home Buying, SIP & Salary |
| Home affordability | 74 · …– How Much House Can I Afford? | 64 · …– What Can I Afford? |
| EMI | 73 · …– Loan EMI, Interest & Amortization Schedule | 60 · …– Loan EMI, Interest & Schedule |
| Loan prepayment | 73 · …– Interest & Tenure Savings | 68 · …– Reduce EMI or Tenure |
| Loan | 72 · …– Personal Loan EMI, Interest & Total Cost | 62 · …– Personal Loan EMI and Interest |

Every title still starts with the page's primary query from Search Console (for example "home loan eligibility calculator", "personal loan", "home loan prepayment … reduce emi / reduce tenure"). The eligibility and prepayment titles now match those longer queries more closely.

**Regression guard:** `buildMetadata` in `lib/seo.ts` now throws if a rendered title exceeds `MAX_TITLE_LENGTH` (70), so `npm run build` fails before an over-long title ships. Tests are in `lib/__tests__/seo.test.ts`.

**Search Console, last 28 days to 17 October 2026:** 801 impressions and 5 clicks. The Home Loan EMI page had 473 impressions (average position 81.7), eligibility 214 (80.1), loan 58 (83.4), home loan 26 (43.4) and prepayment 20 (73.9). Daily impressions rose from 22 on 13 October to 239 on 17 October, and that day's average position was 70.1. These are the "before" figures for this title change. Compare per page from 28 days after each URL is recrawled.

### 3b. Competitor-gap release (19 October 2026)

A competitor review covered Paisabazaar, Bajaj Finserv, HDFC, ICICI, Axis, ClearTax, Groww, ET Money, Kotak and emicalculator.net. Search was US-based, so Google India ranks are not verified. The review led to these changes:

| Change | Why |
|---|---|
| **Prepayment: new "Increase EMI every year" input** (engine, UI, 8 tests against an independent reference simulation) | No competitor checked offers it. Search Console shows "increase emi for home loan calculator" (pos. 63.5) and "home loan tenure reduction calculator". |
| **Prepayment: RBI section and FAQ** updated to the Pre-payment Charges on Loans Directions, 2025 (RBI/2025-26/64, for loans from 1 Jan 2026), with the official source link | The page described only the older rule. Checked against rbi.org.in. |
| **Eligibility: salary table from ₹15k to ₹2L (14 rows)**, generated by the engine | Search Console shows "15000/35000/45000/70000 salary" queries. The 9 existing rows came out identical. |
| **Home loan EMI: amount × tenure EMI grid** (₹10L–₹2Cr × 10–30 years), generated by the engine | Queries such as "10 lakh … 20 years", "25 lakh … 15 years", "1.5 crore". Paisabazaar has a similar grid. |
| **CSV download of the full schedule** on the EMI, Home Loan EMI, Loan, Home Loan and Car Loan calculators (5 tests) | emicalculator.net and Paisabazaar offer exports; most others don't. |

Figures in the new tables and FAQs are computed at build time by the same engine as the calculators, so they cannot drift apart.

**Backlog, from the same review:**
- Calendar-dated and financial-year schedules.
- Shareable URL with the inputs.
- Rate-change (repo reset) scenarios.
- Multiple dated prepayments.
- Flat→reducing converter on the Loan Calculator (reuse `carLoan.ts`).
- Gross→net salary inside the eligibility calculator (reuse the salary engine).
- Loan-offer comparison.

Avoid lead gating, fake rating markup and stale bank-rate auto-fill.

## 4. Manual actions

1. **Vercel → Domains:** point `moneymetric.in` directly to `https://www.moneymetric.in`, so that `http://moneymetric.in` redirects in one hop.
2. **Search Console → URL Inspection:** request indexing for the Home Loan EMI and Eligibility URLs after deploy. Confirm that "User-declared canonical" equals "Google-selected canonical".
3. **Search Console → Sitemaps:** confirm `https://www.moneymetric.in/sitemap.xml` reads as *Success* with 20 URLs discovered.
4. **Search Console → Pages:** check whether any priority URL is listed under "Crawled – currently not indexed" or "Duplicate, Google chose different canonical".
5. **Links:** the main ranking constraint is now domain authority, which code cannot fix. Earn genuine links and mentions, for example from relevant communities, real-estate partners or explanatory content. Do not buy links.

## 5. Post-deployment measurement checklist

Compare equal-length windows, at the earliest **28 days after Google recrawls** the changed URL. Use URL Inspection's "Last crawl" date as the start point. Each week, export to `docs/seo/` or a sheet:

- [ ] **Site level** (Performance → Search results, 28 days vs previous 28 days): clicks, impressions, CTR and average position.
- [ ] **Page level:** filter Page = each priority URL and record clicks, impressions, CTR and position. Note the date each URL was recrawled.
- [ ] **Query level:** for each page, open the Queries tab and track:
  - *EMI page:* home loan emi calculator, home loan emi, housing loan emi calculator, home loan monthly emi, "[amount] lakh home loan emi"
  - *Eligibility:* home loan eligibility calculator, home loan eligibility based on salary, "home loan on [salary] salary"
  - *Prepayment:* home loan prepayment calculator, emi calculator with prepayment
  - *Loan:* personal loan calculator, loan calculator, loan interest calculator
- [ ] **Cannibalization:** filter Query = "home loan emi calculator" and "home loan calculator", then check the Pages tab. If two MoneyMetric URLs swap for the same query from week to week, review the internal anchors and how distinct the intros are.
- [ ] **CTR vs position:** a page holding a stable position in the top 20 but with a CTR well below others at the same position is the signal to test a new title or description. Change one variable per test, for at least 28 days.
- [ ] **New query discovery:** sort queries with more than 10 impressions and 0 clicks. A real user question the page doesn't answer is a candidate for an FAQ or section; a mismatched intent means no action.
- [ ] **Coverage:** Pages report shows no new "Excluded" reasons for calculator URLs.
- [ ] **Core Web Vitals:** once field data exists, there are no "Poor" mobile URL groups.

Do not attribute changes in rankings or traffic to this release until the recrawl-plus-28-days window has passed. With impressions in single or double digits, week-to-week swings are noise.
