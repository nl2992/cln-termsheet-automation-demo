// Heuristic "paste an email / deal blotter, auto-fill the form" parser.
// Purely client-side regex/dictionary matching — no LLM call, no network.
// Deliberately conservative: only ever proposes fills for fields that are
// still empty, and only when it finds a reasonably confident label match.

import { Field } from './schema'

export interface AutofillMatch {
  key: string
  label: string
  value: string
  /** the raw line/snippet that produced this match, for the review list */
  source: string
}

// Extra label synonyms beyond each field's own `l` text (lowercased, no punctuation).
const SYNONYMS: Record<string, string[]> = {
  issuer: ['issuer'],
  dealer: ['dealer', 'arranger', 'dealer arranger'],
  isin: ['isin', 'isin code', 'security identifier'],
  issuerrating: ['rating', 'ratings', 'issuer rating'],
  tradedate: ['trade date', 'trade dt'],
  issuedate: ['issue date', 'settlement date', 'value date'],
  maturitydate: ['maturity date', 'redemption date', 'final maturity'],
  tenor: ['tenor', 'term', 'duration'],
  settlecurrency: ['currency', 'settlement currency', 'ccy', 'denomination currency'],
  notional: ['notional', 'principal amount', 'aggregate notional', 'size', 'aggregate principal amount', 'nominal amount'],
  denom: ['minimum denomination', 'min denomination', 'denomination'],
  issueprice: ['issue price'],
  calcamount: ['calculation amount', 'calc amount'],
  finalredemptionpct: ['final redemption amount', 'redemption at maturity', 'redemption amount at maturity'],
  lar: ['linear accretion rate', 'lar', 'accretion rate', 'accretion yield'],
  optredemptiondate: ['optional redemption date', 'call date', 'call option date'],
  callredemptionpct: ['redemption amount call option', 'call redemption amount', 'call price'],
  callnoticedays: ['notice period', 'call notice', 'business days notice'],
  refentity: ['reference entity', 'ref entity'],
  seniority: ['seniority'],
  coupon: ['coupon', 'coupon rate'],
  governinglaw: ['governing law'],
  listing: ['listing'],
  calcagent: ['calculation agent', 'calc agent'],
  clearing: ['clearing', 'clearing system'],
  guarantor: ['guarantor'],
  commoncode: ['common code'],
  series: ['series', 'tranche', 'series tranche'],
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function buildLookup(fields: Field[]): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const f of fields) {
    lookup.set(normalize(f.l), f.k)
    for (const syn of SYNONYMS[f.k] ?? []) {
      lookup.set(normalize(syn), f.k)
    }
  }
  return lookup
}

function cleanValue(v: string): string {
  return v.trim().replace(/^[-–—:\s]+/, '').replace(/[.;]\s*$/, '').trim()
}

/**
 * Scan free text (pasted email / deal blotter / term sheet excerpt) for
 * "Label: value" style lines and match them against the given product's
 * field labels (+ synonyms). Returns proposed matches; caller decides
 * whether/how to apply them (only to currently-empty fields, by default).
 */
export function autofillFromText(text: string, fields: Field[]): AutofillMatch[] {
  const lookup = buildLookup(fields)
  const fieldsByKey = new Map(fields.map((f) => [f.k, f]))
  const matches: AutofillMatch[] = []
  const seen = new Set<string>()

  const lines = text.split(/\r?\n/)
  const lineRe = /^\s*[-*•]?\s*([A-Za-z][A-Za-z0-9 /()&'.-]{2,60}?)\s*[:=–—-]\s*(.+?)\s*$/

  for (const rawLine of lines) {
    const m = rawLine.match(lineRe)
    if (!m) continue
    const [, rawLabel, rawValue] = m
    const norm = normalize(rawLabel)
    const key = lookup.get(norm) ?? fuzzyMatch(norm, lookup)
    if (!key || seen.has(key)) continue
    const value = cleanValue(rawValue)
    if (!value) continue
    seen.add(key)
    matches.push({ key, label: fieldsByKey.get(key)?.l ?? key, value, source: rawLine.trim() })
  }

  // Standalone patterns that don't need an explicit "Label:" prefix.
  if (!seen.has('isin')) {
    const isinMatch = text.match(/\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b/)
    if (isinMatch && fieldsByKey.has('isin')) {
      matches.push({ key: 'isin', label: 'ISIN', value: isinMatch[1], source: isinMatch[0] })
    }
  }
  if (!seen.has('notional')) {
    const notionalMatch = text.match(/\b(USD|EUR|GBP|JPY|CHF)\s?([\d,]{4,})\b/)
    if (notionalMatch && fieldsByKey.has('notional')) {
      matches.push({ key: 'notional', label: 'Aggregate Notional / Principal Amount', value: notionalMatch[2], source: notionalMatch[0] })
      if (fieldsByKey.has('settlecurrency') && !seen.has('settlecurrency')) {
        matches.push({ key: 'settlecurrency', label: 'Settlement Currency', value: notionalMatch[1], source: notionalMatch[0] })
      }
    }
  }

  return matches
}

// Loose fallback: match if every word in the field label appears in the line label
// (or vice versa for short labels), catches things like "Notional Amount" vs "Notional".
function fuzzyMatch(norm: string, lookup: Map<string, string>): string | undefined {
  const words = norm.split(' ').filter(Boolean)
  if (words.length === 0) return undefined
  for (const [candidate, key] of lookup) {
    const cWords = candidate.split(' ').filter(Boolean)
    if (cWords.length === 0) continue
    const overlap = cWords.filter((w) => words.includes(w)).length
    const ratio = overlap / Math.max(cWords.length, words.length)
    if (ratio >= 0.7 && overlap >= 1 && cWords.length <= 4) return key
  }
  return undefined
}
