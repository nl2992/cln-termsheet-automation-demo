// Product/field schema for the term sheet builder.
// Reconciled from the generic HSBC "Callable Linear Zero Coupon Notes" template
// (pages 1-9) plus the original design handoff (README.md / Term Sheet Builder.dc.html).
// All data here is for a fake demo product — no real client/template content.

export type FieldType = 'text' | 'num' | 'date' | 'select' | 'area'

export interface Field {
  k: string
  l: string
  t: FieldType
  o?: string[]
  d?: string
  ph?: string
  u?: string
  req?: boolean
  /** "Usually fixed" in the real template — shown editable but pre-filled, not required */
  fixed?: boolean
}

export interface Section {
  title: string
  fields: Field[]
  /** Regulatory/selling-restriction style sections: collapsed by default */
  advanced?: boolean
}

export interface Product {
  id: string
  label: string
  assetClass: string
  enabled: boolean
}

export const PRODUCTS: Product[] = [
  { id: 'autocall', label: 'Autocallable / Phoenix', assetClass: 'Equities', enabled: false },
  { id: 'fcn', label: 'Fixed Coupon Note (FCN / One-Star)', assetClass: 'Equities', enabled: false },
  { id: 'accumulator', label: 'Accumulator', assetClass: 'Equities', enabled: false },
  { id: 'twinwin', label: 'Twin-Win Note', assetClass: 'Equities', enabled: false },
  { id: 'superbull', label: 'Superbull Autocallable', assetClass: 'Equities', enabled: false },

  { id: 'cln', label: 'Credit Linked Note (CLN)', assetClass: 'Credit', enabled: true },
  { id: 'clnaxe', label: 'CLN Axe', assetClass: 'Credit', enabled: false },
  { id: 'repackpickup', label: 'Bond Repack — Pick-up', assetClass: 'Credit', enabled: false },
  { id: 'repackcds', label: 'Bond Repack — CDS Overlay', assetClass: 'Credit', enabled: false },

  { id: 'linearzerocln', label: 'Callable Linear Zero Coupon Notes', assetClass: 'Rates', enabled: true },
  { id: 'sofrfloater', label: 'Callable Capped/Floored Floater', assetClass: 'Rates', enabled: false },
  { id: 'fixedcallable', label: 'Fixed / Linear Zero Callable', assetClass: 'Rates', enabled: false },
  { id: 'inflation', label: 'Inflation Linked Note', assetClass: 'Rates', enabled: false },
  { id: 'rangeaccrual', label: 'Range Accrual Note', assetClass: 'Rates', enabled: false },

  { id: 'fxrange', label: 'FX Range Accrual + Conversion', assetClass: 'FX', enabled: false },

  { id: 'stepupautocall', label: 'Index Step-up Autocall', assetClass: 'Index', enabled: false },
]

export const ENABLED_PRODUCTS = PRODUCTS.filter((p) => p.enabled)

// ---------------------------------------------------------------------------
// COMMON_PRE — Parties & Identifiers
// ---------------------------------------------------------------------------
export const COMMON_PRE: Section[] = [
  {
    title: 'Parties & Identifiers',
    fields: [
      { k: 'issuer', l: 'Issuer', t: 'select', o: ['HSBC Bank plc'], d: 'HSBC Bank plc', req: true },
      { k: 'dealer', l: 'Dealer / Arranger', t: 'select', o: ['HSBC Bank plc', 'HSBC Securities (USA) Inc.'], d: 'HSBC Bank plc', req: true },
      { k: 'guarantor', l: 'Guarantor', t: 'text', ph: 'None' },
      { k: 'isin', l: 'ISIN', t: 'text', ph: 'XS0000000000', req: true },
      { k: 'commoncode', l: 'Common Code', t: 'text' },
      { k: 'series', l: 'Series / Tranche', t: 'text' },
      { k: 'issuerrating', l: "Issuer's Ratings", t: 'text', ph: 'e.g. Aa3 / A+' },
    ],
  },
]

// ---------------------------------------------------------------------------
// MID — product-specific sections
// ---------------------------------------------------------------------------
export const MID: Record<string, Section[]> = {
  cln: [
    {
      title: 'Reference Credit',
      fields: [
        { k: 'refentity', l: 'Reference Entity', t: 'text', req: true },
        { k: 'refobligation', l: 'Reference Obligation', t: 'text' },
        { k: 'seniority', l: 'Seniority', t: 'select', o: ['Senior Unsecured', 'Subordinated', 'Senior Secured'], req: true },
        {
          k: 'creditevents',
          l: 'Credit Events',
          t: 'area',
          d: 'Bankruptcy; Failure to Pay; Restructuring (Mod-Mod-R)',
        },
        { k: 'settleoncredit', l: 'Settlement on Credit Event', t: 'select', o: ['Auction', 'Fixed Recovery', 'Cash', 'Physical'] },
      ],
    },
    {
      title: 'CLN Coupon',
      fields: [
        { k: 'coupon', l: 'Coupon', t: 'num', u: '% p.a.', req: true },
        { k: 'couponfreq', l: 'Coupon Frequency', t: 'select', o: ['Quarterly', 'Semi-annual', 'Annual'] },
        { k: 'redemption', l: 'Redemption', t: 'select', o: ['Par (no credit event)', 'Recovery-linked'] },
      ],
    },
  ],

  linearzerocln: [
    {
      title: 'Status & Product Description',
      fields: [
        {
          k: 'statusofnotes',
          l: 'Status of Notes',
          t: 'text',
          d: 'Direct, unsecured and unsubordinated obligations of the Issuer',
          req: true,
        },
      ],
    },
    {
      title: 'Linear Zero Coupon Terms',
      fields: [
        { k: 'calcamount', l: 'Calculation Amount', t: 'num', u: 'per note', req: true, ph: 'e.g. 1,000' },
        { k: 'finalredemptionpct', l: 'Redemption at Maturity (Final Redemption Amount)', t: 'num', u: '%', req: true },
        { k: 'lar', l: 'Linear Accretion Rate (LAR) if held to maturity', t: 'num', u: '% p.a.', req: true },
        { k: 'daycountfraction', l: 'Day Count Fraction', t: 'select', o: ['30/360 (unadjusted)', 'ACT/360', 'ACT/365'], d: '30/360 (unadjusted)', fixed: true },
        { k: 'interestcommencement', l: 'Interest Commencement Date', t: 'text', d: 'Not applicable', fixed: true },
        { k: 'putoption', l: 'Redemption at option of Noteholder (Put Option)', t: 'text', d: 'Not applicable', fixed: true },
        { k: 'earlyredemptiontax', l: 'Early Redemption Amount (upon redemption for taxation reasons or illegality)', t: 'text', d: 'Fair Market Value', fixed: true },
        { k: 'earlyredemptiondefault', l: 'Early Redemption Amount (upon redemption following an Event of Default)', t: 'text', d: 'Fair Market Value', fixed: true },
        { k: 'earlyredemptionfx', l: 'Early Redemption Amount (upon redemption following an FX Disruption Event or a Benchmark Trigger Event)', t: 'text', d: 'Fair Market Value', fixed: true },
        { k: 'altpaymentccy', l: 'Payment of Alternative Payment Currency Equivalent', t: 'text', d: 'Not applicable', fixed: true },
      ],
    },
    {
      title: 'Call Option',
      fields: [
        { k: 'callapplicable', l: 'Redemption at option of Issuer (Call Option)', t: 'select', o: ['Applicable', 'Not applicable'], d: 'Applicable', req: true },
        { k: 'callnoticedays', l: 'Call Notice Period', t: 'num', u: 'Business Days', d: '5' },
        { k: 'optredemptiondate', l: 'Optional Redemption Date (Call Option)', t: 'date', req: true },
        { k: 'callredemptionpct', l: 'Redemption Amount (Call Option)', t: 'num', u: '% of Calculation Amount', req: true },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// COMMON_POST — Dates / Sizing & Pricing / Legal & Operational / Regulatory
// ---------------------------------------------------------------------------
export const COMMON_POST: Section[] = [
  {
    title: 'Dates',
    fields: [
      { k: 'tradedate', l: 'Trade Date', t: 'date', req: true },
      { k: 'strikedate', l: 'Strike / Initial Valuation Date', t: 'date' },
      { k: 'issuedate', l: 'Issue / Settlement Date', t: 'date', req: true },
      { k: 'finalvaluationdate', l: 'Final Valuation Date', t: 'date' },
      { k: 'maturitydate', l: 'Maturity / Redemption Date', t: 'date', req: true },
      { k: 'tenor', l: 'Tenor', t: 'text', ph: 'e.g. 5 Years', req: true },
    ],
  },
  {
    title: 'Sizing & Pricing',
    fields: [
      { k: 'settlecurrency', l: 'Settlement Currency', t: 'select', o: ['USD', 'EUR', 'GBP', 'JPY', 'CHF'], d: 'USD', req: true },
      { k: 'notional', l: 'Aggregate Notional / Principal Amount', t: 'num', req: true, ph: 'e.g. 10,000,000' },
      { k: 'denom', l: 'Minimum Denomination', t: 'num', ph: 'e.g. 1,000' },
      { k: 'issueprice', l: 'Issue Price', t: 'num', u: '%', d: '100' },
      { k: 'reofferprice', l: 'Re-offer Price', t: 'num', u: '%' },
    ],
  },
  {
    title: 'Legal & Operational',
    fields: [
      { k: 'calcagent', l: 'Calculation Agent', t: 'select', o: ['HSBC Bank plc'], d: 'HSBC Bank plc', req: true },
      { k: 'governinglaw', l: 'Governing Law', t: 'select', o: ['English Law', 'New York Law'], d: 'English Law', req: true },
      { k: 'jurisdiction', l: 'Applicable Law / Jurisdiction', t: 'text', d: 'England' },
      { k: 'listing', l: 'Listing', t: 'select', o: ['Unlisted', 'Luxembourg Stock Exchange (Euro MTF)', 'London Stock Exchange'], d: 'Unlisted' },
      { k: 'settlementtype', l: 'Settlement Type', t: 'select', o: ['Cash', 'Physical'], d: 'Cash', fixed: true },
      { k: 'businessdays', l: 'Business Day(s)', t: 'text', ph: 'e.g. London, New York' },
      { k: 'bdconvention', l: 'Business Day Convention', t: 'select', o: ['Modified Following', 'Following', 'Preceding'], d: 'Modified Following' },
      { k: 'formofnote', l: 'Form of Note', t: 'select', o: ['Global Note', 'Definitive Note'], d: 'Global Note' },
      { k: 'formofglobalbearer', l: 'Form of Global Bearer Note', t: 'select', o: ['NGN', 'CGN'], d: 'NGN' },
      { k: 'clearing', l: 'Clearing System', t: 'select', o: ['Euroclear / Clearstream', 'DTC'], d: 'Euroclear / Clearstream' },
    ],
  },
  {
    title: 'Regulatory & Selling Restrictions',
    advanced: true,
    fields: [
      { k: 'finsaexemption', l: 'FinSA Exemption (Switzerland)', t: 'text', ph: 'Applicable exemption from prospectus requirement under FinSA' },
      { k: 'euukprospectusexemption', l: 'EU / UK Prospectus Regulation Exemption', t: 'text' },
      { k: 'prohibitioneeauk', l: 'Prohibition of Sales to EEA and UK Retail Investors', t: 'select', o: ['Applicable', 'Not applicable'], d: 'Applicable' },
      { k: 'distributioncompliance', l: '40-day Distribution Compliance Period', t: 'select', o: ['Applicable', 'Not applicable'], d: 'Applicable' },
      { k: 'taxgrossup', l: 'Taxation Gross-up', t: 'text', d: 'None — the Issuer will not gross-up for any withholding or deduction' },
      { k: 'ustaxconsiderations', l: 'Additional U.S. Federal Income Tax Considerations', t: 'area' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Scenario Analysis — buy-back/secondary market sensitivity shift buckets.
// These configure the illustrative shift table headers shown in the preview.
// The price cells under each bucket are pricing-engine output and are NOT
// modeled here (out of scope for a form-filler demo) — preview renders "—".
// ---------------------------------------------------------------------------
export interface ScenarioConfig {
  fundingSpreadShifts: string
  rateCurveShifts: string
  volShifts: string
}

export const SCENARIO_DEFAULTS: ScenarioConfig = {
  fundingSpreadShifts: '-1.00%, 0.00%, 1.00%, 3.00%',
  rateCurveShifts: '-1.00%, 0.00%, 1.00%, 5.00%',
  volShifts: '-25.00%, 0.00%, 25.00%, 50.00%',
}

export function assembleSections(productId: string): Section[] {
  return [...COMMON_PRE, ...(MID[productId] ?? []), ...COMMON_POST]
}

export function allFields(productId: string): Field[] {
  return assembleSections(productId).flatMap((s) => s.fields)
}
