# Field Inventory — `linearzerocln` (Callable Linear Zero Coupon Notes)

Working doc, updated as more termsheet pages come in. Source: HSBC "Structured Rates Notes — XXX
Callable Linear Zero Coupon Notes due XXX" generic template (12 pages total; **pages 1–5 reviewed so far**).

Scope note: keeping `cln` (Credit Linked Note) and `linearzerocln` (this product) as two distinct
enabled products, per existing README. Not reclassifying `linearzerocln`'s asset-class grouping right
now — flagged below as an open item since the actual template has no credit/reference-entity content.

---

## Status vs. existing README schema

The README's current `MID['linearzerocln']` definition (Reference Entity, Zero-coupon Accretion Yield,
Linear Amortisation Schedule, Callable Yes/No, Seniority) **does not match this real template** — it
looks like it was copied from the Credit CLN product. Replacing it below with what's actually on the
termsheet, will finalize once all 12 pages are in.

---

## Confirmed fields (from pages 1–5)

### Maps to existing COMMON_PRE / COMMON_POST (no new field needed, just confirms usage)
| Template label | Existing schema field | Notes |
|---|---|---|
| Issuer | COMMON_PRE `Issuer*` | Value is fixed text "HSBC Bank plc..." in this template — likely a default/locked value for this desk, not free entry |
| Currency (cover + table) | COMMON_POST `Settlement Currency*` | Template example shows USD |
| Notional | COMMON_POST `Aggregate Notional*` | — |
| Minimum Denomination | COMMON_POST `Denomination` | — |
| Trade Date | COMMON_POST `Trade Date*` | — |
| Issue Date | COMMON_POST `Issue/Settlement Date*` | — |
| Issue Price | COMMON_POST `Issue Price` | Template shows fixed "100% of Aggregate Principal Amount" — treat as default 100, likely non-editable for this product |
| Maturity Date | COMMON_POST `Maturity/Redemption Date*` | — |

### New fields needed (not in current schema)
| Proposed key | Label | Type | Required | Notes |
|---|---|---|---|---|
| `issuerrating` | Issuer's Ratings | text | – | e.g. "Aa3/A+" — new, no home in current schema |
| `tenor` | Tenor | text | Y | Explicit line on both cover and terms table — not currently modeled anywhere (COMMON_POST has individual dates but no tenor field) |
| `callnoticedays` | Call Notice Period | num (Business Days), default 5 | – | From "...giving holders at least 5 Business Days' notice..." — confirmed **editable** (varies per deal per your answer) |
| `optredemptiondate` | Optional Redemption Date (Call Option) | date | Y (if callable) | — |
| `callredemptionpct` | Redemption Amount (Call Option) | num, % | Y (if callable) | "XXX% of Calculation Amount on [optredemptiondate]" |
| `finalredemptionpct` | Redemption at Maturity (Final Redemption Amount) | num, % | Y | "XXX% per Calculation Amount" |
| `lar` | Linear Accretion Rate (LAR) if held to maturity | num, % p.a. | Y | Renames/replaces old `Zero-coupon Accretion Yield` field to match actual template terminology |

### Existing fields to reconsider
| Field | Issue |
|---|---|
| `Callable` (Yes/No select, default No) | Product name is literally "Callable Linear Zero Coupon Notes" — callability looks **inherent to this product**, not a toggle. Recommend dropping the Yes/No select for `linearzerocln` (keep it only if `cln` or another product needs a shared toggle). |
| `Reference Entity`, `Seniority` | No mention anywhere in pages 1–5 (no credit event language at all, only generic issuer-default risk boilerplate common to all notes). Suspect these were wrongly copied from the Credit `cln` product. **Holding off removing until pages 6–12 (likely T&Cs) confirm there's no reference-entity structure.** |

---

## Static / boilerplate (not form fields — render as fixed template text)
- "What are Callable Linear Zero Coupon Notes?" explainer (Objectives / Payment on Maturity / Early
  Redemption paragraphs)
- "Scenario Analysis" intro disclaimer paragraph
- "Important Notice to Investors" investor-profile checklist (General risks / Note Issuer-specific risks /
  Interest rate risks / Call option risks)
- "Buy-back/Secondary Market Price" explanatory text + the impact-direction table (deterioration →
  negative, rate increase → negative, etc. — this is generic, always the same direction logic)
- Entire page 5 (EEA/UK retail restrictions, FinSA, SFA product classification, prospectus regulation
  boilerplate) — fully static legal text, no XXX fields found

## Open / needs more pages or your input
- **Scenario Analysis simulation table** ("Redemption at XXX per Calculation Amount") — looks like a
  **derived/computed value** (mirrors `finalredemptionpct`?) rather than manual entry. Confirm once we see
  if it ever differs from the Final Redemption Amount above.
- **Illustrative Examples shift tables** (Issuer funding spread, Interest rate curve, Market implied
  volatility): the shift-bucket headers (-1.00%/0.00%/+1.00%/+3.00%, -25%/0%/25%/50%, etc.) are confirmed
  **editable per deal**. The XXX cells under "Trade Date" / "12 months forward" rows look like **pricing
  engine outputs**, not something a desk user types in — flagging as likely **out of scope** for a
  term-sheet-filler form (would need a pricing model, not a field). Confirm intent once more of the doc is seen.
- Seniority / capital structure ranking — not yet seen; may appear in full T&Cs (pages 6–12)
- Coupon / interest mechanics — none seen yet (consistent with "zero coupon", but confirm no hidden coupon
  section later in the doc)
- Governing law, listing, clearing, day count — none confirmed yet against COMMON_POST fields; expect these
  in later pages
- Asset-class placement of `linearzerocln` (currently under "Credit" in README) — real template is a Rates
  product with zero credit content. Not urgent per your answer, but worth a final decision before ship.

---

## Page-by-page log
- **p.1/12** — Cover: title, "aims to return 100%..." standfirst, Tenor, Issuer (fixed text), currency-denominated line, decorative tree image (design asset, ignore for data model)
- **p.2/12** — Key Indicative Terms table (source of most confirmed fields above) + Scenario Analysis section header
- **p.3/12** — Investor risk-profile checklist (static) + Buy-back/Secondary Market Price intro + factor-impact table (static)
- **p.4/12** — Illustrative Examples shift tables (open item above) + "other factors" boilerplate
- **p.5/12** — Legal/regulatory boilerplate (fully static)
- **p.6/12** — **Product Description** (Issuer, Dealer, Applicable Law/Jurisdiction, Status of Notes, Ratings,
  fixed Product Name) + **General Terms of the Notes** (ISIN, Principal Amount, Denomination Currency &
  Denomination, Calculation Amount, Trade/Issue/Maturity Date, Issue Price, Settlement Currency, Business
  Day(s)/Convention, Call Option block incl. Redemption Amount, Put Option — fixed "Not applicable", Final
  Redemption Amount, LAR, three Early Redemption Amount lines — all fixed "Fair Market Value", Interest
  Commencement Date/Day Count Fraction — fixed, Alternative Payment Currency — fixed) + **Additional
  Information** (Listing)
- **p.7/12** — Form of Notes (static description) + Form of Global Bearer Note, Clearing System, Calculation
  Agent, FinSA/EU/UK prospectus exemptions, Prohibition of Sales EEA/UK, 40-day Distribution Compliance
  Period, Tax Treatment (static disclaimer) + Taxation Gross-up, Additional US Federal Income Tax
  Considerations
- **p.8/12** — Risk Factors: fully static legal boilerplate (Issuer credit risk, no active market, Event of
  Default, reinvestment risk, calc agent discretion, etc.) — **no XXX fields**
- **p.9/12** — Continuation of Risk Factors (static) + Selling Restrictions intro + Reg S / TEFRA D (static) +
  start of EEA/UK retail-investor definitions (static, continues to pages 10-12 which we're deferring)
- **p.10–12** — deferred by request (further regulatory/selling-restriction boilerplate, low value for the
  form-filler MVP)

## Resolution — implemented in `src/schema.ts`
Pages 6-9 confirmed nearly everything flagged as "open" after page 5, and matched the user's own
field-classification pass (Needed: Yes / Sometimes / Usually fixed) almost exactly. Implemented as:
- **Required inputs** (`req: true`): tenor, notional, settlement currency, calc agent, governing law, trade/
  issue/maturity date, issuer/dealer, ISIN, calculation amount, final redemption %, LAR, call applicable,
  optional redemption date, call redemption %, status of notes.
- **"Usually fixed" fields** (`fixed: true`): pre-filled with the template's default text (Put Option "Not
  applicable", the three Early Redemption Amount lines "Fair Market Value", Day Count Fraction "30/360
  (unadjusted)", Interest Commencement Date "Not applicable", Settlement Type "Cash", Alternative Payment
  Currency "Not applicable") — editable but not required, since these rarely change deal-to-deal.
- **"Sometimes" regulatory/selling-restriction fields**: grouped into a single collapsed "Regulatory & Selling
  Restrictions" section (FinSA exemption, EU/UK prospectus exemption, EEA/UK retail prohibition, 40-day
  distribution compliance, tax gross-up, US tax considerations) — present but out of the way by default.
- **Reference Entity / Seniority removed** from `linearzerocln` — pages 6-9 confirm there is genuinely no
  credit-event/reference-entity structure anywhere in this template (Risk Factors section is pure
  issuer-credit-risk boilerplate common to any note). Those fields now only exist on the `cln` (Credit
  Linked Note) product, which is correct.
- **`linearzerocln` moved to the Rates asset class** (was filed under Credit) — the template is titled
  "Structured Rates Notes" and has zero credit content, so Rates is the accurate classification. `cln`
  (Credit Linked Note) stays under Credit with its original reference-entity/credit-event field set.
- **Scenario Analysis shift buckets** implemented as user-editable text fields (per "sometimes varies"), but
  the simulated price cells under each bucket are explicitly out of scope (would need a real pricing engine)
  and render as "—" in the preview with a note to that effect.
