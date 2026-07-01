import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ENABLED_PRODUCTS,
  PRODUCTS,
  Field,
  Section,
  assembleSections,
  allFields,
  SCENARIO_DEFAULTS,
  ScenarioConfig,
} from './schema'
import { autofillFromText, AutofillMatch } from './autofill'
import { loadState, saveState } from './storage'

const ASSET_CLASS_ORDER = ['Equities', 'Credit', 'Rates', 'FX', 'Index']
const CLIENT_SEGMENTS = ['Institutional', 'Private Bank', 'Corporate Treasury', 'Wholesale']
const ENVIRONMENT = 'UAT'

function isSatisfied(f: Field, values: Record<string, string>): boolean {
  return Boolean(values[f.k]?.trim()) || Boolean(f.d)
}

function displayValue(f: Field, values: Record<string, string>): string {
  const v = values[f.k]
  if (v && v.trim()) return v.trim() + (f.u && f.t === 'num' ? ` ${f.u}` : '')
  if (f.d) return f.d + (f.u && f.t === 'num' ? ` ${f.u}` : '')
  return ''
}

function refIdFor(productId: string): string {
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  return `HSBC-${productId.slice(0, 4).toUpperCase()}-${ym}`
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function App() {
  const persisted = useMemo(() => loadState(), [])
  const [productId, setProductId] = useState<string>(() => {
    const pid = persisted?.productId
    return pid && ENABLED_PRODUCTS.some((p) => p.id === pid) ? pid : 'linearzerocln'
  })
  const [values, setValues] = useState<Record<string, string>>(persisted?.values ?? {})
  const [client, setClient] = useState(persisted?.client ?? CLIENT_SEGMENTS[0])
  const [templateName, setTemplateName] = useState(persisted?.templateName ?? '')
  const [pasteText, setPasteText] = useState('')
  const [autofillMatches, setAutofillMatches] = useState<AutofillMatch[] | null>(null)
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
  const [scenario, setScenario] = useState<ScenarioConfig>(SCENARIO_DEFAULTS)
  const [attempted, setAttempted] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const product = PRODUCTS.find((p) => p.id === productId)!
  const sections = useMemo(() => assembleSections(productId), [productId])
  const fields = useMemo(() => allFields(productId), [productId])

  // Seed defaults for any field not yet present in values (on mount + product switch).
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev }
      let changed = false
      for (const f of fields) {
        if (next[f.k] === undefined) {
          next[f.k] = ''
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [fields])

  useEffect(() => {
    saveState({ productId, values, client, templateName })
  }, [productId, values, client, templateName])

  const completion = useMemo(() => {
    const total = fields.length
    const filled = fields.filter((f) => isSatisfied(f, values)).length
    return { total, filled, pct: total ? Math.round((filled / total) * 100) : 0 }
  }, [fields, values])

  const requiredMissing = useMemo(
    () => fields.filter((f) => f.req && !isSatisfied(f, values)),
    [fields, values],
  )

  function handleChange(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }))
    setSaved(false)
  }

  function handleProductChange(id: string) {
    setProductId(id)
    setAttempted(false)
  }

  function handleReset() {
    if (!window.confirm('Clear all field values, template and validation state?')) return
    setValues({})
    setTemplateName('')
    setPasteText('')
    setAutofillMatches(null)
    setAttempted(false)
  }

  function handleSaveDraft() {
    saveState({ productId, values, client, templateName })
    setSaved(true)
  }

  function handleExport() {
    if (requiredMissing.length > 0) {
      setAttempted(true)
      return
    }
    window.print()
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setTemplateName(file.name)
    if (file.name.toLowerCase().endsWith('.txt')) {
      file.text().then((text) => {
        setPasteText(text)
        runScan(text)
      })
    }
    e.target.value = ''
  }

  function runScan(text: string) {
    const matches = autofillFromText(text, fields)
    setAutofillMatches(matches)
    setSelectedMatches(new Set(matches.map((m) => m.key)))
  }

  function applyAutofill() {
    if (!autofillMatches) return
    setValues((prev) => {
      const next = { ...prev }
      for (const m of autofillMatches) {
        if (selectedMatches.has(m.key)) next[m.key] = m.value
      }
      return next
    })
    setAutofillMatches(null)
    setSaved(false)
  }

  const requiredChip =
    requiredMissing.length > 0 ? (
      <span className="chip chip-danger">{requiredMissing.length} of {fields.filter((f) => f.req).length} required outstanding</span>
    ) : (
      <span className="chip chip-success">✓ Required complete</span>
    )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-tile">HSBC</div>
          <div className="title-block">
            <div className="title-main">Structured Products</div>
            <div className="title-sub">Term Sheet Automation</div>
          </div>
        </div>
        <div className="header-right">
          <label className="header-label">Client Segment</label>
          <select value={client} onChange={(e) => setClient(e.target.value)}>
            {CLIENT_SEGMENTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <span className="env-badge">{ENVIRONMENT}</span>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="toolbar-row">
            <label className="header-label">Product</label>
            <select value={productId} onChange={(e) => handleProductChange(e.target.value)}>
              {ASSET_CLASS_ORDER.map((ac) => (
                <optgroup label={ac} key={ac}>
                  {PRODUCTS.filter((p) => p.assetClass === ac).map((p) => (
                    <option key={p.id} value={p.id} disabled={!p.enabled}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="chip chip-asset">{product.assetClass}</span>
          </div>
          <div className="toolbar-row">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completion.pct}%`, background: completion.pct === 100 ? '#3a8f47' : '#DB0011' }} />
            </div>
            <span className="progress-label">
              {completion.filled} / {completion.total} fields · {completion.pct}%
            </span>
            {requiredChip}
          </div>
        </div>
        <div className="toolbar-right">
          <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,.doc,.xlsx,.xls,.xml" style={{ display: 'none' }} onChange={handleFileSelected} />
          <button className="btn" onClick={handleUploadClick}>↑ Upload Template</button>
          {templateName && (
            <span className="chip chip-success">
              {templateName} {templateName.toLowerCase().endsWith('.txt') ? '· scanned for fields' : '· fields auto-mapped'}{' '}
              <button className="chip-x" onClick={() => setTemplateName('')}>×</button>
            </span>
          )}
          <button className="btn" onClick={handleReset}>Reset</button>
          <button className="btn" onClick={handleSaveDraft}>{saved ? '✓ Saved' : 'Save Draft'}</button>
          <button className="btn btn-primary" onClick={handleExport}>Export PDF</button>
        </div>
      </div>

      <div className="main-body">
        <main className="form-pane">
          <AutofillCard
            pasteText={pasteText}
            setPasteText={setPasteText}
            onScan={() => runScan(pasteText)}
            matches={autofillMatches}
            selected={selectedMatches}
            setSelected={setSelectedMatches}
            onApply={applyAutofill}
            onDismiss={() => setAutofillMatches(null)}
          />

          {sections.map((section) => (
            <SectionCard key={section.title} section={section} values={values} onChange={handleChange} attempted={attempted} />
          ))}

          <ScenarioCard scenario={scenario} setScenario={setScenario} />
        </main>

        <aside className="preview-pane">
          <Preview
            product={product}
            client={client}
            sections={sections}
            values={values}
            scenario={scenario}
          />
        </aside>
      </div>
    </div>
  )
}

function SectionCard({
  section,
  values,
  onChange,
  attempted,
}: {
  section: Section
  values: Record<string, string>
  onChange: (k: string, v: string) => void
  attempted: boolean
}) {
  const [open, setOpen] = useState(!section.advanced)
  return (
    <div className="card">
      <div className="card-header" onClick={() => section.advanced && setOpen((o) => !o)} style={{ cursor: section.advanced ? 'pointer' : 'default' }}>
        <span className="card-tab" />
        <h2>{section.title}</h2>
        {section.advanced && <span className="advanced-toggle">{open ? '▾' : '▸'} {open ? 'hide' : 'show'} regulatory fields</span>}
      </div>
      {open && (
        <div className="card-body">
          {section.fields.map((f) => (
            <FieldControl key={f.k} field={f} value={values[f.k] ?? ''} onChange={(v) => onChange(f.k, v)} error={Boolean(attempted && f.req && !(values[f.k]?.trim() || f.d))} />
          ))}
        </div>
      )}
    </div>
  )
}

function FieldControl({
  field,
  value,
  onChange,
  error,
}: {
  field: Field
  value: string
  onChange: (v: string) => void
  error: boolean
}) {
  const spanBoth = field.t === 'area'
  return (
    <div className={spanBoth ? 'field field-wide' : 'field'}>
      <label>
        {field.l}
        {field.req && <span className="req-star">*</span>}
      </label>
      {field.t === 'select' ? (
        <select className={error ? 'err' : ''} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.d ?? field.ph ?? '—'}</option>
          {field.o?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.t === 'area' ? (
        <textarea className={error ? 'err' : ''} value={value} placeholder={field.d ?? field.ph} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : field.u ? (
        <div className="unit-row">
          <input className={error ? 'err' : ''} type={field.t === 'num' ? 'text' : field.t} inputMode={field.t === 'num' ? 'decimal' : undefined} value={value} placeholder={field.d ?? field.ph} onChange={(e) => onChange(e.target.value)} />
          <span className="unit-chip">{field.u}</span>
        </div>
      ) : (
        <input className={error ? 'err' : ''} type={field.t === 'num' ? 'text' : field.t} inputMode={field.t === 'num' ? 'decimal' : undefined} value={value} placeholder={field.d ?? field.ph} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && <div className="err-note">Required — please complete</div>}
    </div>
  )
}

function AutofillCard({
  pasteText,
  setPasteText,
  onScan,
  matches,
  selected,
  setSelected,
  onApply,
  onDismiss,
}: {
  pasteText: string
  setPasteText: (v: string) => void
  onScan: () => void
  matches: AutofillMatch[] | null
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  onApply: () => void
  onDismiss: () => void
}) {
  return (
    <div className="card autofill-card">
      <div className="card-header">
        <span className="card-tab" />
        <h2>Auto-fill from Pasted Content</h2>
      </div>
      <div className="card-body card-body-single">
        <div className="field field-wide">
          <label>Paste a deal email, blotter line, or draft term sheet excerpt</label>
          <textarea
            rows={4}
            placeholder={'e.g.\nTrade Date: 02-Jul-2026\nNotional: USD 10,000,000\nLinear Accretion Rate: 4.25%'}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
        </div>
        <div className="autofill-actions">
          <button className="btn" disabled={!pasteText.trim()} onClick={onScan}>
            Scan for Matches
          </button>
          {matches && <span className="progress-label">{matches.length} field{matches.length === 1 ? '' : 's'} recognized</span>}
        </div>
        {matches && matches.length > 0 && (
          <div className="autofill-matches">
            {matches.map((m) => (
              <label key={m.key} className="autofill-match-row">
                <input
                  type="checkbox"
                  checked={selected.has(m.key)}
                  onChange={(e) => {
                    const next = new Set(selected)
                    if (e.target.checked) next.add(m.key)
                    else next.delete(m.key)
                    setSelected(next)
                  }}
                />
                <span className="autofill-match-label">{m.label}</span>
                <span className="autofill-match-value">{m.value}</span>
              </label>
            ))}
            <div className="autofill-actions">
              <button className="btn btn-primary" onClick={onApply} disabled={selected.size === 0}>
                Apply Selected ({selected.size})
              </button>
              <button className="btn" onClick={onDismiss}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {matches && matches.length === 0 && <div className="progress-label">No recognizable "Label: value" fields found in that text.</div>}
      </div>
    </div>
  )
}

function ScenarioCard({ scenario, setScenario }: { scenario: ScenarioConfig; setScenario: (s: ScenarioConfig) => void }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-tab" />
        <h2>Scenario Analysis — Buy-back Sensitivity Shift Buckets</h2>
      </div>
      <div className="card-body">
        <div className="field field-wide">
          <label>Issuer Funding Spread Shifts</label>
          <input value={scenario.fundingSpreadShifts} onChange={(e) => setScenario({ ...scenario, fundingSpreadShifts: e.target.value })} />
        </div>
        <div className="field field-wide">
          <label>Interest Rate Curve Shifts</label>
          <input value={scenario.rateCurveShifts} onChange={(e) => setScenario({ ...scenario, rateCurveShifts: e.target.value })} />
        </div>
        <div className="field field-wide">
          <label>Market Implied Volatility Shifts</label>
          <input value={scenario.volShifts} onChange={(e) => setScenario({ ...scenario, volShifts: e.target.value })} />
        </div>
        <div className="field field-wide scenario-note">
          Note: the buckets above configure the preview table headers only. The simulated price under each
          bucket is pricing-engine output and is intentionally out of scope for this form-filler demo — it
          renders as "—" in the preview.
        </div>
      </div>
    </div>
  )
}

function Preview({
  product,
  client,
  sections,
  values,
  scenario,
}: {
  product: { id: string; label: string; assetClass: string }
  client: string
  sections: Section[]
  values: Record<string, string>
  scenario: ScenarioConfig
}) {
  const finalRedemption = values.finalredemptionpct?.trim()
  return (
    <div id="tsheet">
      <div className="indicative-badge">INDICATIVE</div>
      <div className="masthead">
        <div className="logo-tile logo-tile-sm">HSBC</div>
        <div className="eyebrow">Indicative Term Sheet</div>
        <div className="product-name">{product.label}</div>
        <div className="sub-line">
          {product.assetClass} · Structured Products · {client}
        </div>
      </div>
      <div className="meta-row">
        <span className="confidential-tag">PRIVATE &amp; CONFIDENTIAL</span>
        <span>
          Ref: {refIdFor(product.id)} · {formatToday()}
        </span>
      </div>

      {sections.map((section) => (
        <div className="preview-section" key={section.title}>
          <div className="preview-section-title">{section.title}</div>
          {section.fields.map((f) => {
            const val = displayValue(f, values)
            return (
              <div className="preview-row" key={f.k}>
                <span className="preview-label">{f.l}</span>
                <span className={val ? 'preview-value' : 'preview-value preview-empty'}>{val || '—'}</span>
              </div>
            )
          })}
        </div>
      ))}

      <div className="preview-section">
        <div className="preview-section-title">Scenario Analysis</div>
        <div className="preview-row">
          <span className="preview-label">Redemption at Maturity</span>
          <span className={finalRedemption ? 'preview-value' : 'preview-value preview-empty'}>
            {finalRedemption ? `${finalRedemption}% of Calculation Amount` : '—'}
          </span>
        </div>
        {(
          [
            ['Issuer Funding Spread Shifts', scenario.fundingSpreadShifts],
            ['Interest Rate Curve Shifts', scenario.rateCurveShifts],
            ['Market Implied Volatility Shifts', scenario.volShifts],
          ] as const
        ).map(([label, buckets]) => (
          <div className="preview-row" key={label}>
            <span className="preview-label">{label}</span>
            <span className="preview-value">{buckets}</span>
          </div>
        ))}
      </div>

      <div className="preview-footer">
        This is an illustrative, indicative term sheet generated for demonstration purposes from a fake
        generic template. It does not represent an offer to sell, purchase or subscribe to any investment.
      </div>
    </div>
  )
}
