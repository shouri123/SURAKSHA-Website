# SURAKSHA Demo Lab (`/demo-lab`) Anti-Slop Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate every AI-slop signal measured on `/demo-lab` (Sitepeel score 88/100) without altering factual copy, hydrological figures, station data, or backend contracts—first removing decorative clutter, then restyling with a bespoke brand palette, clear typographic hierarchy, real flood-modeling imagery, and modern HTML/CSS primitives.

**Architecture:** Preserve the Next.js 16 App Router client/server architecture and `/api/flood/scenarios` deterministic simulation contract. Update shared brand/neutral tokens (`app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`) and shared public shell components (`PublicNavbar.tsx`, `PublicFooter.tsx`, `ThemeToggle.tsx`, `BrandLogo.tsx`) alongside `app/demo-lab/page.tsx` and the 5 `components/simulation/*` modules so the entire rendered `/demo-lab` DOM obeys every rule.

**Tech Stack:** Next.js 16, React 18, TypeScript, Tailwind CSS v3, IBM Plex Sans + Inter + JetBrains Mono, native `<dialog>`, WAI-ARIA `tablist` + `@container` responsive tables, Node Test Runner (`node --test`).

---

## Color & Type Decisions (2-Line Specification)

- **Color:** Preserve `#09090B` background and `#FFFFFF` text; replace stock Tailwind `emerald-500` (`#10B981`) with a shifted bespoke brand token `--brand: #0FA978` (dark) / `#0B8A61` (light) and `--brand-strong: #14BF88`, and tint all `zinc-*`/`slate-*` neutrals toward `#0FA978` (`#0D1110` surface, `#121816` elevated card, `#1E2723` hairline border, `#97A39E` muted text, `#687570` subtle text).
- **Type:** Set all headings (`h1`/`h2`/`h3`/`h4`) in `IBM Plex Sans` (`font-heading`), set body copy, UI labels, buttons, captions, and dates in `Inter` (`font-sans`, with `tabular-nums` on inline numbers), and restrict `JetBrains Mono` (`font-mono`) strictly to station/scenario codes and the forecast data table.

## Rule Compliance Matrix

| Rule | Current Tell Found on `/demo-lab` | Planned Fix |
|---|---|---|
| No sparkle / magic-wand icons | 4 `<Sparkles />` icons in `app/demo-lab/page.tsx` | Remove `Sparkles` import and all 4 usages; express synthetic/diagnostic state in plain prose |
| Accent ≠ exact `#10b981` | Tailwind `emerald-500` & `#10B981` across page, CSS, SVG | Replace with `--brand: #0FA978` (`#0B8A61` light, `#14BF88` hover) in CSS tokens, Tailwind config, and SVG strokes |
| No `backdrop-filter` on cards (top bar only) | `backdrop-blur-md`/`xl`/`2xl` on 10+ cards, dropdowns, modals, navbar pills | Remove `backdrop-blur-*` from all cards, popups, dropdowns, modals, and `ThemeToggle`; keep only on sticky `<header>` top bar |
| Icons only where they carry meaning | Decorative `LayoutDashboard`, `FlaskConical`, `BookOpen`, `Info`, `Moon`, `PlusCircle`, `ShieldCheck`, `Users`, `Clock`, `TrendingUp`, `BarChart3`, `Sliders` | Remove `.icon-glass` decorative icons from `PublicNavbar` links, simplify `ThemeToggle`, remove decorative card-header/button icons; retain functional icons (transport controls, alerts, close, check, spinner, 4 hazard-driver glyphs) |
| Monospace only on code, commands, tables | `font-mono` on `BCA MINOR PROJECT`, dates, labels, buttons, captions, ward pills | Use `font-sans` (`Inter`) + `tabular-nums` on all UI labels, dates, KPIs, and captions; keep `font-mono` strictly on codes (`STN-PAT-01`, scenario codes) and `<table>` cells |
| Neutrals ≠ stock Tailwind `zinc`/`slate`/`gray` | `zinc-200..950`, `slate-400`, `#A1A1AA` in CSS, navbar, footer, charts | Replace with `#0FA978`-tinted neutral tokens (`--surface`, `--surface-elevated`, `--border`, `--muted-foreground`) |
| No stock `shadow-lg`/`shadow-xl`/`shadow-md` stacks | `shadow-md`, `shadow-2xl`, `shadow-xs` on cards, buttons, bars | Remove stock shadows from cards, bars, pills, buttons; use `1px solid var(--border)` and tonal contrast; use single tinted shadow token only on floating popovers/modals |
| Headings not set in Inter | Card/section titles rendered as `<span>` inheriting `Inter` | Render every page, section, card, and modal title as semantic `<h1>`–`<h4>` with `font-heading` (`IBM Plex Sans`) |
| At most one small capital label per screen | 12+ `uppercase tracking-wider` labels across headers, KPIs, charts, footer | Convert card sub-labels, KPI titles, chart annotations, dropdown headers, table headers, and footer headings to Sentence case; retain at most one small-caps label (`BCA MINOR PROJECT`) |
| No `" · "` separators in running text | 6+ middle dots (`STN-PAT-01 · Gandhi Ghat, Patna`, `NSE Score: 0.962 · MAE: 0.28m`, etc.) | Replace all `" · "` and `<span>·</span>` with commas, line breaks, or flex `gap` |
| Real picture of product in first two screens | Only faint `opacity-20` banner behind header; no visible product imagery | Add an un-blurred **Study Reach & Hydrodynamic Evidence** strip in the upper workspace featuring `hydrodynamic-river-routing.jpg` and `sentinel1-sar-inundation.jpg` (plus clear `hero-himalayas-ganga.jpg` thumbnail) with factual captions |
| No swapped clichés | No cream/terracotta, italic serif words, or `Space Grotesk`/`Satoshi`/etc. | Stay strictly within `#09090B` + `#0FA978` + `#FFFFFF` + `IBM Plex Sans` + `Inter` |
| Spend boldness in one place | Visual energy scattered across glowing pills and shadows | Concentrate visual authority on the **Stage Cross-Section + 24h Hydrograph** paired with real **Hydrodynamic Routing & SAR Flood Extent** imagery |

## Global Constraints

- **Copy preservation:** Keep all factual figures, station names (`STN-PAT-01`, `Gandhi Ghat, Patna`, `Historic HFL 50.52m`, `Danger 48.0m` / `48.6m`), scenario names, and safety disclaimers intact. Do not invent testimonials, customer logos, or metrics.
- **Test contract preservation (`test/website.test.mjs`):** Preserve `river_discharge_multiplier: inflow`, `synthetic_data_only === true`, `data.jev_mode === "OFFLINE_DETERMINISTIC_SIMULATOR"`, `data_provenance === "SYNTHETIC_SCENARIO"`, `+6h`/`+12h`/`+24h`, `Highest returned stage`, `offline run did not check a live authority bulletin or external source`, `aria-pressed={theme === "dark"}`, `html.light main`, `html.light .workspace-shell`, `hydrograph-chart`, `ROLE: {profile?.role || "Unavailable"}`, and `Platform` dropdown keyboard/outside-click handlers.

## Review Focus

1. **Modal `<dialog>` accessibility & light-dismiss:** Both Custom Scenario Studio and Detailed Forecast Inspector use native `<dialog>` with `showModal()`, `overscroll-behavior: contain`, `Esc` state synchronization, and pointer-down/up outside backdrop dismissal without locking `body` overflow.
2. **Tablist keyboard & non-color selection indicator:** `Disaster Impact Infographics`, `AI Causal Diagnostics`, and `BCA Technical Defense` expose `role="tablist"` / `role="tab"` / `aria-selected` / `ArrowLeft`–`ArrowRight` roving focus and a `border-block-end` active indicator (WCAG 1.4.1).
3. **Forecast table mobile responsiveness:** Forecast Inspector `<table>` wraps in a focusable `role="region"` container with `<caption>` and `@container (width < 600px)` stacked cards.
4. **Light and dark mode parity:** All `#0FA978`-tinted neutral tokens and `--brand` tokens resolve cleanly in both `html.dark` and `html.light` with ≥ 4.5:1 text contrast and ≥ 3:1 UI boundary contrast.
5. **Zero regressions on `node --test` and `next build`:** TypeScript compiles cleanly and all assertions in `test/website.test.mjs` pass.

---

### Task 1: Brand Palette, Tinted Neutrals, Typography & Modern CSS Primitives

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces CSS custom properties `--brand`, `--brand-strong`, `--brand-soft`, `--brand-border`, `--surface`, `--surface-elevated`, `--surface-raised`, `--border`, `--muted-foreground`, `--subtle-foreground`, `--shadow-overlay`, and Tailwind `brand` + `neutral-tinted` theme tokens.

- [ ] **Step 1: Update `tailwind.config.ts` with shifted brand tokens (`#0FA978`) and tinted neutral scale**
  Add `brand` color palette (`500: "#0FA978"`, `400: "#14BF88"`, `600: "#0B8A61"`) and brand-tinted `surface` / `ink` helpers while preserving existing config keys used by other routes.

- [ ] **Step 2: Update `app/globals.css` tokens, typography rules, dialog/backdrop rules, and remove card blur/stock glass animations**
  1. In `:root` (light) and `.dark`, set `--background: #09090B` (dark), `--surface: #0D1110`, `--surface-elevated: #121816`, `--surface-raised: #18201D`, `--border: #1F2925`, `--muted-foreground: #97A39E`, `--subtle-foreground: #6B7873`, `--primary: #0FA978` (dark) / `#0B8A61` (light), `--brand: #0FA978`, `--brand-strong: #14BF88`, `--shadow-overlay: 0 16px 40px -12px rgba(3, 12, 9, 0.75)`.
  2. Set `color-scheme: dark light;` on `:root` (`html.dark` -> `dark`, `html.light` -> `light`) and `accent-color: var(--brand);` for form controls.
  3. Add native `<dialog>` top-layer scroll containment (`dialog:modal { overscroll-behavior: contain; }`, `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; background: rgba(5, 8, 7, 0.78); }`) and `.forecast-table-wrapper` `@container` responsive stacked table rules.
  4. Strip `backdrop-filter` and `glassPulseGlow` / `iconGlassFloat` shimmer from `.btn-glass*`, `.icon-glass`, and `.nav-glass-pill`; keep `.glass-panel` solid (`#0D1110` + 1px `#1F2925` border).
  5. Preserve `html.light main`, `html.light .workspace-shell`, and `.hydrograph-chart` rules required by `test/website.test.mjs`.

- [ ] **Step 3: Update `app/layout.tsx` metadata and selection token**
  Add `<meta name="color-scheme" content="dark light" />` (or `viewport` metadata) and update `selection:bg-[#0FA978]/30`.

---

### Task 2: Clean Up Shared Shell (`PublicNavbar`, `PublicFooter`, `ThemeToggle`, `BrandLogo`)

**Files:**
- Modify: `components/shared/BrandLogo.tsx`
- Modify: `components/theme/ThemeToggle.tsx`
- Modify: `components/navigation/PublicNavbar.tsx`
- Modify: `components/navigation/PublicFooter.tsx`

**Interfaces:**
- Consumes `--brand`, `--surface*`, `--border`, `--muted-foreground`.
- Preserves all route links and `test/website.test.mjs` invariants.

- [ ] **Step 1: Update `BrandLogo.tsx` wave strokes to `#0FA978` / `#38C798` and solid border container**
  Remove `.icon-glass` blur dependency on the logo mark; use crisp `border border-[var(--border)] bg-[var(--surface-elevated)]`.

- [ ] **Step 2: Simplify `ThemeToggle.tsx` to remove decorative `Moon`/`Sun` glass box and Tailwind `zinc-*` classes**
  Replace `Moon` / `Sun` icons and `backdrop-blur-md` + `zinc-*` classes with a minimal, high-contrast semantic button (`aria-pressed={theme === "dark"}`, `aria-label`, text/geometric polarity dot indicator) styled with `var(--surface-elevated)` and `var(--border)`.

- [ ] **Step 3: Remove decorative Lucide icons, card blur, `shadow-2xl`, and `zinc-*` grays from `PublicNavbar.tsx`**
  1. Remove `LayoutDashboard`, `FlaskConical`, `BookOpen`, `Info`, `MapPin` `.icon-glass` icon bubbles from nav links and dropdown items. Keep `ChevronDown` only as a subtle disclosure cue on `Platform` and account menus, `Menu`/`X` on mobile toggle, and `ArrowRight` on primary CTA.
  2. Keep `backdrop-blur-md` ONLY on the sticky `<header>` top bar; remove `backdrop-blur-*` and `shadow-2xl` from dropdown menus and mobile drawer, replacing with solid `bg-[var(--surface-elevated)] border border-[var(--border)]` and `shadow-[var(--shadow-overlay)]`.
  3. Replace all `zinc-*` and `emerald-*` classes with tinted neutral tokens and `--brand` tokens.
  4. Keep `ROLE: {profile?.role || "Unavailable"}`, `Account role could not be verified`, and keyboard/outside-click handlers intact.

- [ ] **Step 4: Update `PublicFooter.tsx` to remove middle dot, small-caps headers, `font-mono` disclaimer, and `zinc-*` grays**
  1. Change `"Research Prototype · Academic Evaluation"` to `"Research Prototype, Academic Evaluation"`.
  2. Convert the 3 footer `<h4>` headings from `uppercase tracking-wider` to `font-heading` Sentence case.
  3. Remove `font-mono` from `"Not an official government warning authority."` and replace `zinc-*` with `var(--muted-foreground)` / `var(--subtle-foreground)`.

---

### Task 3: Restyle Simulation Visualization Components (`components/simulation/*`)

**Files:**
- Modify: `components/simulation/HydrometricStageStaffGauge.tsx`
- Modify: `components/simulation/RiskGauge.tsx`
- Modify: `components/simulation/CompoundHazardFlowInfographic.tsx`
- Modify: `components/simulation/RiverStageForecastChart.tsx`
- Modify: `components/simulation/ScenarioComparisonChart.tsx`

- [ ] **Step 1: `HydrometricStageStaffGauge.tsx` — solid card, Sentence case labels, `font-heading`, `--brand` tokens**
  Remove `backdrop-blur-md`, `shadow-xs`, `shadow-md`, decorative `Waves` header icon, `uppercase` labels (`River Stage`, `Embankment`, `HISTORIC HFL`, `DANGER MARK`, `WARNING`), and `font-mono` on labels (keep `tabular-nums` in `font-sans`). Use `<h3>` with `font-heading` for `"Stage Elevation Cross-Section"` and `--brand` (`#0FA978`) for nominal states.

- [ ] **Step 2: `RiskGauge.tsx` — replace `#10B981` and small-caps badge**
  Shift nominal green from `#10B981` to `#0FA978`; convert `Low Risk` / `Moderate Risk` / `High Risk` pill to Sentence case (`font-sans` instead of `uppercase tracking-wider`); use `tabular-nums` on score readout.

- [ ] **Step 3: `CompoundHazardFlowInfographic.tsx` — solid panel, Sentence case, clean driver grid**
  Remove `backdrop-blur-md`, `shadow-xs`, decorative `Waves` header icon, `uppercase tracking-wider` labels, and `font-mono` on non-code labels. Use `<h3>` with `font-heading` for `"Multi-Driver Compound Hazard Infographic"`, `--brand` tokens for active state, and keep the 4 physical driver icons (`Mountain`, `CloudRain`, `Waves`, `Zap`) for fast visual scanning.

- [ ] **Step 4: `RiverStageForecastChart.tsx` — remove middle dots, small-caps, stock shadows, and `#10B981`**
  1. Replace `"Reach Inundation Model · 24-Hour Horizon"` with `"Reach Inundation Model, 24-Hour Horizon"` and `"STN-PAT-01 · Gandhi Ghat"` with `<code className="font-mono">STN-PAT-01</code> <span>Gandhi Ghat</span>` (no middle dot).
  2. Remove `uppercase tracking-wider` and `font-mono` from the 4 telemetry metric labels (`River Stage`, `Discharge`, `Catchment Rain`, `Soil Saturation`) and chart legend; keep `tabular-nums` on numbers.
  3. Replace `#10B981` / `emerald-500` strokes, fills, and buttons with `#0FA978` / `var(--brand)`, remove `shadow-xs`, and convert SVG threshold tags (`Historic HFL`, `Danger Mark`, `Warning Mark`) to clean Sentence case.

- [ ] **Step 5: `ScenarioComparisonChart.tsx` — replace `slate-400` and `shadow-md`**
  Replace Tailwind `slate-400` baseline bars/dots with brand-tinted neutral `#6B7873` (`--subtle-foreground`), remove `shadow-md shadow-sky-500/20`, and use `tabular-nums` in `font-sans` for bar value readouts.

---

### Task 4: Overhaul `app/demo-lab/page.tsx` (Remove Clutter First, Then Restyle & Add Real Product Imagery)

**Files:**
- Modify: `app/demo-lab/page.tsx`

- [ ] **Step 1: Pass 1 (Removal) — Strip banned tells and decorative elements**
  1. Remove `Sparkles` import and all 4 `<Sparkles />` usages (`BCA MINOR PROJECT`, `SURAKSHA Multi-Variable Reasoning`, `AI Diagnostic Reasoning`, `Predicted Peak Stage`).
  2. Remove decorative header/button icons (`ShieldCheck`, `Users`, `Clock`, `TrendingUp`, `BarChart3`, `PlusCircle`, `Sliders`, `Radio`, `Activity`, `Waves`). Retain `Play`, `Pause`, `RotateCcw`, `ChevronLeft`, `ChevronRight`, `AlertTriangle`, `CircleAlert`, `Check`, `X`, `LoaderCircle`, `Calendar`, `ChevronDown`.
  3. Remove all `backdrop-blur-md`, `backdrop-blur-xl`, `backdrop-blur-2xl` from cards, dropdown popups, and modals.
  4. Remove all `shadow-xs`, `shadow-md`, `shadow-2xl`, and colored shadow utilities from cards, buttons, and banners.
  5. Remove all `" · "` and `<span>·</span>` separators (header station string, station dropdown rows, danger banner, NSE/MAE line, Hydrograph card header, Diagnostic title, Defense NSE/MAE lines, Forecast Modal header).
  6. Remove `uppercase tracking-wider` / `uppercase tracking-widest` / `uppercase` from all labels except the single permitted small-caps identifier (`BCA MINOR PROJECT`).
  7. Remove `font-mono` from all non-code labels, dates, KPI values, timeline day pills, ward tags, and prose; keep `font-mono` exclusively on station/scenario codes (`STN-PAT-01`, `activeScenario.code`) and `<table>` cells, using `tabular-nums` in `font-sans` for numeric telemetry.

- [ ] **Step 2: Pass 2 (Visual Evidence & Restyle) — Add real product imagery near top & apply typographic/token hierarchy**
  1. Replace the hidden `opacity-20` background image in the header with a clean solid surface header, and introduce a compact **Study Reach & Hydrodynamic Evidence** strip directly above/integrated into the upper workspace (visible within the first screen) showcasing two real, un-blurred assets from `public/images/`:
     - `/images/hydrodynamic-river-routing.jpg` — *1D/2D Hydrodynamic Reach Routing (Middle Ganga Floodplain)*
     - `/images/sentinel1-sar-inundation.jpg` — *Sentinel-1 SAR Flood Extent Validation Reference*
     styled with crisp 1px borders (`border-[var(--border)]`), `bg-[var(--surface-elevated)]`, and `next/image` `sizes` + proper `alt` descriptions.
  2. Promote every card, section, and modal title to semantic `<h2>` / `<h3>` with `font-heading` (`IBM Plex Sans`).
  3. Replace all `emerald-*` classes with `var(--brand)` / `brand-*` (`#0FA978` / `#14BF88`) and all neutral grays with `--surface*` / `--border` / `--muted-foreground` tokens.
  4. Upgrade the 3-tab panel (`Disaster Impact Infographics`, `AI Causal Diagnostics`, `BCA Technical Defense`) to WAI-ARIA `role="tablist"` / `role="tab"` / `role="tabpanel"` with keyboard arrow navigation and a `border-b-2` active indicator (not color alone).
  5. Upgrade both modals (`isStudioOpen` and `isForecastModalOpen`) to native `<dialog>` with `showModal()`, `onCancel` sync, backdrop click dismissal, and `.forecast-table-wrapper` responsive table (`<caption>`, `role="region"`, `tabindex="0"`).

---

### Task 5: Automated Verification, Build Check & Visual/DOM Audit

**Files:**
- Modify (if needed for any new static assertions): `test/website.test.mjs`

- [ ] **Step 1: Add regression assertions in `test/website.test.mjs` for `/demo-lab` anti-slop rules**
  Verify `app/demo-lab/page.tsx` contains no `Sparkles`, no `backdrop-blur-`, no `shadow-md` / `shadow-2xl`, no ` · ` separators in JSX copy, includes real `<Image` product visuals (`hydrodynamic-river-routing.jpg`, `sentinel1-sar-inundation.jpg`), uses native `<dialog`, and preserves all required API/provenance strings.

- [ ] **Step 2: Run unit tests, lint, and production build**
  Run: `node --test && npm run lint && npm run build`
  Expected: All tests pass, zero lint errors, Next.js build succeeds cleanly.

- [ ] **Step 3: Inspect rendered `/demo-lab` in headless/dev browser or check computed styles**
  Start `npm run dev` or `npm run start` and visually/programmatically verify computed styles on `/demo-lab` (solid card backgrounds, zero card `backdrop-filter`, `IBM Plex Sans` on headings, `Inter` on body/labels, `#0FA978` accent, tinted grays, visible product photos in first two screens, zero middle dots).
