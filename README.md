# CLN Term Sheet Automation (Demo)

**This is a fake demo product.** The "HSBC" branding, the generic termsheet template, the field values, and
every example in this repo are illustrative only — no real client data, no real templates, no real deal
terms. It exists to prove the field-automation concept is workable, not to be used for actual issuance.

## Running it
```
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build to dist/
```
`npm run build` outputs a **single self-contained `dist/index.html`** (JS/CSS inlined via
`vite-plugin-singlefile`, no `dist/assets/*`) — required for firm dashboard deployment, which only
accepts one HTML file. Verify with `find dist -type f` — it should list only `index.html`.

No backend, no database. Templates are never stored — the user uploads/pastes their own each session
(`↑ Upload Template`, or paste text into "Auto-fill from Pasted Content"). Everything (form values, draft
state) lives in the browser via `localStorage`.

**What's implemented**: two products (`cln` = Credit Linked Note, `linearzerocln` = Callable Linear Zero
Coupon Notes — the rest of the 16-product catalog is defined but greyed out per the original design), a
field-driven form with live term-sheet preview, PDF export via print, and a client-side "paste an email/
blotter → auto-fill matching fields" parser (`src/autofill.ts`) using label/synonym matching, not an LLM
call. See [field-inventory.md](field-inventory.md) for how the `linearzerocln` field set was derived from a
real (genericized) HSBC termsheet template, page by page, and `src/schema.ts` for the field definitions.

---

## Original Design Handoff

The sections below are the original design-handoff spec this app was built from. They describe the intended
look/behavior in detail; `src/` is the actual implementation (not a 1:1 port of the `.dc.html` prototype —
see the note on that file's format below).

## Overview
A structured-products **term sheet auto-filler** for an HSBC-style markets/sales desk. The user picks a
product type, fills in an adaptive set of fields (grouped into sections), and a formatted **indicative term
sheet** renders live alongside the form. Required fields are validated before the term sheet can be exported
to PDF. A template can be "uploaded" (front-end only — no parsing/booking is wired).

The current build ships **16 product types across 5 asset classes**, but only **CLN (Credit Linked Note)** and
**Linear Zero CLN** are enabled/selectable; the rest are present but greyed out in the product dropdown.

## About the Design Files
The file in this bundle (`Term Sheet Builder.dc.html`) is a **design reference created in HTML** — a working
prototype showing the intended look, layout, and behavior. It is **not production code to copy directly**.

> Note on format: the prototype is a "Design Component" (`.dc.html`) authored in a proprietary
> streaming-template runtime (`<x-dc>`, `<sc-for>`, `<sc-if>`, a `class Component extends DCLogic`, and
> `renderVals()`). **Do not port that runtime.** Read it as a spec: the `<sc-for>`/`<sc-if>` tags are loops
> and conditionals, `renderVals()` is the derived-state/view-model layer, and `this.state` is component state.
> Recreate it in the target codebase's existing environment (React, Vue, Angular, SwiftUI, etc.) using that
> project's established component library, form primitives, and styling patterns. If no environment exists yet,
> **React + TypeScript** is the natural fit (the logic maps 1:1 to a function component with a `useReducer`/
> `useState` view-model), with plain CSS or the team's preferred styling approach.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are specified below and in the
prototype. Recreate the UI faithfully using the codebase's existing UI kit. If the target app already has a
design system, map these tokens onto its equivalents rather than hard-coding hex values.

---

## Layout (single screen, 3-pane app shell)

Full-viewport (`100vh`), vertical flex, no page scroll — panes scroll internally.

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER  (56px)  logo · title            client-segment select · env   │
├──────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (auto)  Product ▼ · asset chip · progress · required chip      │
│                 …spacer…  Upload · Reset · Save Draft · [Export PDF]    │
├───────────────────────────────┬──────────────────────────────────────┤
│ FORM (flex:1, scrolls)        │ PREVIEW (fixed 500px, scrolls)         │
│  max-width 760px, centered    │  dark #3a3a38 backing                  │
│  stacked section cards        │  white "term sheet" sheet inside       │
└───────────────────────────────┴──────────────────────────────────────┘
```

- **Header**: white bg, 1px bottom border `#dcdcd8`, height 56px, horizontal padding 20px, `gap:16px`.
  - Left cluster: a red logo tile (`#DB0011` bg, white bold "HSBC" text, 7px 9px padding) + two-line title
    ("Structured Products" 13.5px/700, "Term Sheet Automation" 10.5px uppercase `#8a8a86` letter-spacing .09em).
  - Right cluster: "Client Segment" label + a `<select>` (min-width 190px) + an **environment badge**
    (amber: text `#8a5a00`, bg `#fdf1d8`, border `#eddba5`, 10px/700).
- **Toolbar**: bg `#f7f7f5`, 1px bottom border `#dcdcd8`, padding 10px 20px, `gap:16px`, align-items center.
  - Left block (min-width 360px, column, `gap:6px`):
    - Row 1: "Product" label + **product `<select>`** (bold 13px, grouped by asset class via `<optgroup>`,
      disabled options greyed) + asset-class **chip** (red: text `#DB0011`, bg `#fdecec`, border `#f2cdd0`,
      9.5px/700 uppercase, letter-spacing .1em, padding 3px 7px, radius 2px).
    - Row 2: **progress bar** (track 150×5px, bg `#e2e2de`, radius 99px; fill width = completion %,
      bg `#DB0011` when <100%, `#3a8f47` at 100%, `transition:width .3s`) + completion label
      ("`filled / total fields · NN%`", 10.5px `#77776f`) + **required chip** (see Validation).
  - Right: buttons (see Interactions).

### Section cards (form)
Each field group is a card: white bg, 1px border `#e0e0dc`, radius 3px, `margin-bottom:16px`, overflow hidden.
- Header strip: bg `#f7f7f5`, 1px bottom border `#e6e6e2`, padding 11px 18px, `gap:8px`; a 5×14px red tab
  (`#DB0011`, radius 1px) + section title `<h2>` (12.5px/700 uppercase `#2b2b28`, letter-spacing .02em).
- Body: **CSS grid, 2 equal columns**, `gap:16px 22px`, padding 18px. Fields with a `textarea` span both
  columns (`grid-column: 1 / -1`).

### Field control
- **Label**: block, 10px uppercase `#8a8a86`/600, letter-spacing .06em, margin-bottom 5px. Required fields get
  a trailing red asterisk `*` (`#DB0011`, 700, margin-left 3px).
- **Input / select / textarea** base: width 100%, padding 8px 10px (select 8px 26px 8px 10px for the arrow),
  1px border `#d8d8d5`, radius 2px, 13px, bg `#fff`, color `#1c1c1c`, outline none.
  - **Focus**: border `#DB0011` + box-shadow `0 0 0 2px rgba(219,0,17,.12)`.
  - **Error** (required + empty, after a failed export): border `#DB0011`, bg `#fff6f6`, plus a note under the
    control "Required — please complete" (10px `#b3000e`/600, margin-top 4px).
  - Custom select arrow via inline SVG background (no native chrome), `appearance:none`.
- **Numeric fields with a unit** (%, bp, x, % p.a.): input has right radius removed
  (`border-radius:2px 0 0 2px`) and is followed by a **unit chip** — flex-centered, padding 0 11px,
  bg `#f3f3f0`, 1px border `#d8d8d5` (no left border), right radius 2px, 11.5px `#77776f`, `white-space:nowrap`.
- Placeholder color: `#b7b7b1`.

### Preview pane (the term sheet)
- Outer aside: fixed `flex:0 0 500px`, bg `#3a3a38`, scrolls, padding 22px.
- Inner sheet (`id="tsheet"`): white, radius 2px, shadow `0 6px 24px rgba(0,0,0,.28)`, padding 30px 34px 34px,
  `position:relative`. **Serif typography throughout** (`Georgia, "Times New Roman", serif`).
  - Top-right absolute "INDICATIVE" badge (9px/700 `#DB0011`, 1px border `#DB0011`, letter-spacing .14em).
  - Masthead: small red "HSBC" tile, eyebrow "Indicative Term Sheet" (10px uppercase `#8a8a86` ls .16em),
    product name (22px/700 `#181818`), sub-line "`{assetClass} · Structured Products · {client}`" (12px `#767670`).
    Bottom border `3px solid #DB0011`.
  - Meta row: confidentiality tag (left, 700 `#3a3a38`) + "`Ref: {refId} · {date}`" (right). Ref format:
    `HSBC-{PRODUCTID4}-{YYYYMM}`. Date `dd Mon yyyy` (en-GB).
  - Section groups mirror the form sections. Section heading: 10px uppercase `#DB0011`/700 ls .14em, 1px bottom
    border `#ecd2d4`. Each row: `display:flex; justify-content:space-between`, dotted bottom border `#eee`, 12px.
    Label left (`#6a6a64`, flex 0 0 44%), value right-aligned. **Filled** value: `#161616`/600. **Empty** value:
    renders as em-dash "—" in muted `#c2c2bc`.
  - Footer disclaimer: 9px italic `#a0a09a`, top border `#eee`.

---

## Product model (the core data structure)

Everything is config-driven. A field definition is `{ k, l, t, o?, d?, ph?, u?, req? }`:

| key | meaning |
|-----|---------|
| `k` | unique field key (state key) |
| `l` | label |
| `t` | type: `text` \| `num` \| `date` \| `select` \| `area` |
| `o` | options array (select) |
| `d` | default value (pre-fills; counts as "filled") |
| `ph`| placeholder |
| `u` | unit suffix chip (`%`, `bp`, `x`, `% p.a.`) |
| `req`| required (must be non-empty to export) |

A section is `{ title, fields: Field[] }`. The full form for a product is:
`COMMON_PRE  ++  MID[productId]  ++  COMMON_POST`.

- **COMMON_PRE** — *Parties & Identifiers*: Issuer* (select), Guarantor, Dealer/Arranger (select), ISIN*,
  Common Code, Series/Tranche.
- **MID[productId]** — product-specific sections (see below).
- **COMMON_POST**:
  - *Dates*: Trade Date*, Strike/Initial Valuation Date, Issue/Settlement Date*, Final Valuation Date, Maturity/Redemption Date*.
  - *Sizing & Pricing*: Settlement Currency* (select, default USD), Aggregate Notional*, Denomination, Issue Price (%, default 100), Re-offer Price (%).
  - *Legal & Operational*: Calculation Agent* (select), Governing Law* (select, English Law), Listing (select), Business Day Convention (select, Modified Following), Settlement Type (select), Form of Note (select, Global Note), Clearing (select), Day Count Fraction (select, ACT/360).

(`*` = required.)

**Currency prefixing in the preview**: `notional`, `denom`, `minsize`, `protnotional` are shown prefixed with
the selected settlement currency (e.g. "USD 10,000,000").

### Products (id → label → asset class → enabled)
Only the two enabled products need to work now; keep the rest defined but disabled in the dropdown.

- **Equities** (disabled): `autocall` Autocallable / Phoenix · `fcn` Fixed Coupon Note (FCN / One-Star) · `accumulator` Accumulator · `twinwin` Twin-Win Note · `superbull` Superbull Autocallable
- **Credit**: `cln` Credit Linked Note (CLN) **[ENABLED]** · `clnaxe` CLN Axe · `repackpickup` Bond Repack — Pick-up · `repackcds` Bond Repack — CDS Overlay · `linearzerocln` Linear Zero CLN **[ENABLED]**
- **Rates** (disabled): `sofrfloater` Callable Capped/Floored Floater · `fixedcallable` Fixed / Linear Zero Callable · `inflation` Inflation Linked Note · `rangeaccrual` Range Accrual Note
- **FX** (disabled): `fxrange` FX Range Accrual + Conversion
- **Index** (disabled): `stepupautocall` Index Step-up Autocall

Enabled set = `['cln','linearzerocln']`. The dropdown groups by asset class (`<optgroup>`) in order
`Equities, Credit, Rates, FX, Index`; non-enabled `<option>`s are `disabled`.

### MID sections for the enabled products
**`cln` (Credit Linked Note):**
- *Reference Credit*: Reference Entity* (text), Reference Obligation (text), Seniority* (select: Senior Unsecured/Subordinated/Senior Secured), Credit Events (area, default "Bankruptcy; Failure to Pay; Restructuring (Mod-Mod-R)"), Settlement on Credit Event (select: Auction/Fixed Recovery/Cash/Physical).
- *CLN Coupon*: Coupon* (num, % p.a.), Coupon Frequency (select: Quarterly/Semi-annual/Annual), Redemption (select: Par (no credit event)/Recovery-linked).

**`linearzerocln` (Linear Zero CLN):**
- *Linear Zero CLN*: Reference Entity* (text), Zero-coupon Accretion Yield* (num, % p.a.), Linear Amortisation Schedule (area), Callable (select Yes/No, default No), Seniority (select: Senior Unsecured/Subordinated).

*(The disabled products' MID sections are fully defined in the prototype's `MID` map — port them verbatim when those products are switched on.)*

---

## Interactions & Behavior

- **Select product** → swaps MID sections; common sections persist. Shared field keys (e.g. `refentity`,
  `seniority`, `coupon`) retain their values across products.
- **Form input** → updates `values[key]`; live-updates the preview and the completion/required indicators.
- **Toolbar buttons** (right side, secondary style: white bg, 1px `#cfcfc9`, 12px/600, padding 7px 13px,
  radius 2px; hover border `#b0b0aa`, bg `#f4f4f2`):
  - **↑ Upload Template** — opens a hidden `<input type="file">` (accept `.pdf,.docx,.doc,.xlsx,.xls,.xml`).
    On select, shows a green "Template: {filename} · fields auto-mapped" chip with an × to clear. **No actual
    parsing** — front-end stub only. (This is where real template ingestion would be wired later.)
  - **Reset** — `window.confirm` then clears all field values, template, and validation state.
  - **Save Draft** — persists to storage; button label flips to "✓ Saved" until the next edit.
  - **Export PDF** (primary: bg `#DB0011`, white, 12px/700, padding 7px 15px; hover `#b3000e`) — see Validation.
- **Print/Export**: uses `window.print()` with a print stylesheet that hides everything except `#tsheet`
  (`@media print { body * { visibility:hidden } #tsheet, #tsheet * { visibility:visible } #tsheet { position:absolute; left:0; top:0; width:100%; padding:40px 48px } }`). In the target stack, prefer the app's
  PDF/print approach; the key requirement is **only the term sheet prints**, one clean sheet.

## Form Validation Rules
- A field is **required** when `req:true`. A field is **satisfied** if `values[k]` is non-empty **or** it has a
  default `d`. (So defaulted selects like Currency/Governing Law count as complete.)
- **Required chip** in the toolbar: while any required field is outstanding, show a red pill
  "`N of M required outstanding`" (text `#b3000e`, bg `#fdecec`, border `#f2cdd0`). When zero outstanding,
  show a green pill "✓ Required complete" (text `#2b6b34`, bg `#eef6ef`, border `#c9e2cc`).
- **Export gating**: clicking Export PDF when required fields are missing does **not** print — instead it sets
  an `attempted` flag that turns every missing required field into its error state (red border, `#fff6f6` fill,
  "Required — please complete" note). When nothing is missing, it prints.
- **Reset** clears `attempted`.
- **Completion %** (separate from required): counts *all* fields that are non-empty-or-defaulted ÷ total.

## State Management
Minimal component state:
- `productId: string` (default `'cln'`)
- `values: Record<string,string>` — all field values by key
- `client: string` — selected client segment
- `templateName: string` — uploaded template filename (display only)
- `saved: boolean` — Save Draft feedback
- `attempted: boolean` — whether an export was attempted (drives error display)

Derived (compute per render, don't store): the assembled `sections`, the `preview` groups, completion counts,
required-missing count, `refId`, `today`. In React model these as `useMemo` selectors over state.

**Persistence**: on change, write `{ productId, values, client, templateName }` to `localStorage`
(key `hsbc_ts_builder_v1`); restore on mount. On restore, coerce `productId` back to `'cln'` if it isn't in the
enabled set. Wrap in try/catch.

**Tweakable props** (host-level config in the prototype; expose as component props/settings):
`confidentialityTag` (enum: "PRIVATE & CONFIDENTIAL" | "PUBLIC" | "INTERNAL USE ONLY", default first),
`environment` (enum: PROD | UAT | STAGING | SANDBOX, default UAT).

---

## Design Tokens

**Colors**
- HSBC red (primary): `#DB0011`; hover/darker: `#b3000e`; deep accent text: `#a3000d`
- Red tints: chip bg `#fdecec`, chip border `#f2cdd0`, error fill `#fff6f6`, sheet section border `#ecd2d4`
- Ink: `#1c1c1c` (body), `#181818` / `#161616` (headings/values), `#2b2b28` (section titles)
- Muted greys: `#8a8a86`, `#77776f`, `#767670`, `#6a6a64`, `#a0a09a`, empty-value `#c2c2bc`
- Neutrals/bg: app `#ececea`, toolbar/strip `#f7f7f5`, card body `#fff`, field `#fff`, unit chip `#f3f3f0`,
  preview backing `#3a3a38`
- Borders: `#dcdcd8` (chrome), `#e0e0dc` (card), `#e6e6e2` (strip), `#d8d8d5` (inputs), `#e2e2de` (track)
- Success (green): text `#2b6b34`, bg `#eef6ef`, border `#c9e2cc`, dot/fill `#3a8f47`
- Amber (env badge): text `#8a5a00`, bg `#fdf1d8`, border `#eddba5`

**Typography**
- UI: `'Helvetica Neue', Arial, Helvetica, sans-serif`. Sizes: 9.5–10px (labels/eyebrows/chips, uppercase,
  letter-spacing .06–.16em), 12–13.5px (controls/titles/buttons). Weights 400/600/700.
- Term sheet document: `Georgia, 'Times New Roman', serif`. Product name 22px/700; body 12px; disclaimer 9px italic.

**Spacing** — 4px base rhythm: card gap 16px, grid gap 16px×22px, card padding 18px, header/toolbar padding
10–20px, sheet padding ~30–34px.

**Radius** — 2px (inputs/chips/buttons/sheet), 3px (cards), 1px (accent tab), 99px (pills/progress).

**Shadow** — sheet: `0 6px 24px rgba(0,0,0,.28)`. Focus ring: `0 0 0 2px rgba(219,0,17,.12)`.

## Assets
None. No images, icon fonts, or external assets. The "HSBC" marks are plain text on a red tile — **do not add a
logo image**; in the real HSBC codebase, replace with the official brand component/logo from the internal design
system. The select dropdown arrow is an inline SVG data-URI (a small triangle) and can be replaced by the UI
kit's native select.

## Files
- `Term Sheet Builder.dc.html` — the complete prototype (form config, validation, live preview, persistence).
  Read the `class Component` block for the full product/field schema (the `MID` map is the source of truth for
  every product's fields) and `renderVals()` for all derived-state logic.
