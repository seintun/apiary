# Deep Design: Meaningful Worker Detail Reports

Date: 2026-04-30
Apiary run: `run-20260430-154211-deep-ux-and-data-design-for-complete-worker-deta`

## Executive summary

The right goal is not “every worker detail page looks complete.” That creates fake confidence. The right goal is:

> Every worker detail page displays all available, sourced, fresh-enough information, and clearly labels what is full-report content, what is derived from the ledger, what is actionable, and what is missing.

This requires both data architecture and UX changes:

1. A canonical worker detail view model that merges full report artifacts with ledger-derived fallback.
2. A clear report lifecycle: started → partial → final, with artifact existence/freshness checks.
3. Mobile-first worker detail UX where the full report is discoverable in the first viewport.
4. Provenance/freshness/risk labels so sparse or stale pages are honest.
5. Tests across old/new/missing/stale/unsafe fixtures before deeper automation.

## Current problem

Recent dashboard use exposed several UX/data failures:

- The full report button was hidden or absent for workers with no `reportPath`.
- Some worker detail pages were mostly empty because rich sections only render if a report artifact exists.
- The dashboard had redundant worker chips competing with the All Workers table.
- Auto-refresh could shift the page while Rickie was reading.
- The UI suggested “full report” even when only basic ledger data existed.

The underlying issue: the project has pieces of a reporting system, but no single end-to-end contract from worker output → ledger → report artifact → dashboard preview → full detail page.

## Desired user experience

When Rickie taps a worker, he should immediately understand:

1. What did this worker do?
2. Is there a full generated report?
3. If not, what useful information can be derived from logs/ledger?
4. What evidence/artifacts support the report?
5. What needs action or follow-up?
6. Is the information fresh, stale, partial, or final?

The page should never be blank or mysterious. It should also never pretend derived fallback is a full report.

## Core concept: source-labeled detail view

Introduce a canonical in-memory render shape:

```ts
type WorkerDetailView = {
  headline: string
  summary: string
  currentFocus: string
  completedWork: string[]
  keyFindings: DetailItem[]
  artifacts: ArtifactItem[]
  filesTouched: string[]
  nextSteps: DetailItem[]
  risks: DetailItem[]
  timeline: TimelineItem[]
  facts: {
    role: string
    model: string
    status: string
    startedAt?: string
    lastSeenAt?: string
    completedAt?: string
    elapsed: string
    awaiting?: string
  }
  source: 'full-report' | 'hybrid' | 'ledger-derived'
  reportStatus?: 'partial' | 'final'
  reportUpdatedAt?: string
  freshness: 'fresh' | 'stale-report' | 'missing-report' | 'derived-only'
}

type DetailItem = {
  text: string
  source: 'report' | 'ledger' | 'event' | 'artifact' | 'derived'
  verified?: boolean
}

type ArtifactItem = {
  label: string
  path: string
  kind?: string
  source: 'report' | 'ledger'
}
```

This does not need to be stored in the ledger. It can be derived in `dashboard/worker.js` by a helper:

```js
function deriveWorkerDetailView(worker, run, reportData, reportLoadError) { ... }
```

## Source modes

### Full report

Use when a report artifact loads successfully and supplies structured sections.

UI label: **Full report**

Meaning: this page is primarily backed by worker/coordinator report content.

### Hybrid

Use when a report artifact exists but some sections are filled from ledger/events.

UI label: **Hybrid: report + ledger**

Meaning: report fields are authoritative for report-owned sections, but facts/timeline/fallbacks come from ledger.

### Ledger-derived

Use when no report artifact exists.

UI label: **Derived from ledger**

Meaning: useful detail is built from worker status, summary, events, artifact paths, and timestamps. No generated report was recorded.

## Report lifecycle

Recommended lifecycle:

1. **Worker start**
   - Ledger records worker id, label, role, model role/model, status, startedAt.
   - Detail page can already show a useful snapshot.

2. **Worker progress**
   - Worker/coordinator emits concise events.
   - Ledger summary/awaiting/progress update over time.
   - Detail page derives current focus and timeline.

3. **Partial report**
   - Worker/coordinator may write report preview metadata:
     - `reportHeadline`
     - `reportBullets`
     - `reportStatus: partial`
     - optional `reportPath`
   - UI shows **Partial report** freshness.

4. **Final report**
   - On completion, full structured report artifact should be written if the worker generated one.
   - Ledger records `reportPath`, `reportUpdatedAt`, `reportStatus: final`.
   - If final is claimed without a loadable artifact, UI shows a missing-report risk.

5. **Stale sweep / reconcile**
   - Worker lifecycle status can change without overwriting report state.
   - UI surfaces stale worker/report state as a risk.

## Data fallback rules

Use report data when present; otherwise derive from ledger/events conservatively.

| Section | Preferred source | Fallback |
|---|---|---|
| Headline | `reportHeadline` or report headline | worker label/id |
| Summary | report summary | worker summary |
| Current focus | report `doing` | summary/status |
| Completed work | report `accomplished` | done worker summary |
| Key findings | report `findings` | bounded relevant events, labeled event-derived |
| Artifacts | report artifacts | `worker.artifactPaths` |
| Files touched | report files | none; do not guess |
| Next steps | report next steps | `awaiting` for waiting/blocked states |
| Risks | report risks | stale/failed/blocked/missing-report warnings |
| Timeline | run events for worker | no log entries |
| Facts | ledger | ledger only |

Important: do not infer files touched, conclusions, or success quality from freeform logs unless explicitly recorded.

## UX design

### Main dashboard / worker table

Keep the dashboard compact.

- The All Workers table is the primary worker selector.
- Remove redundant worker chip rows.
- Expanded worker row should show:
  - compact facts
  - one summary line
  - max 3 preview bullets if available
  - source badge
  - always-visible **Open full report** CTA
- Do not show full findings/risks in table rows.

### Full worker detail page

Mobile-first single-column layout:

1. **Top nav**
   - Back to dashboard
   - Worker title
   - status/source badge

2. **Snapshot card** — first viewport
   - one-line summary
   - status/freshness
   - “Needs input” if any
   - primary **Open/view complete report** or **Derived detail only** state

3. **Facts grid**
   - Role
   - Model
   - Seen
   - Elapsed
   - Started
   - Awaiting

4. **Generated**
   - Report-owned headline/summary/accomplishments/findings.
   - Hidden or labeled unavailable if no report exists.

5. **Derived**
   - Ledger-derived status, recent events, model route, elapsed/recency.
   - Explicitly labeled **Generated from worker log and artifact metadata**.

6. **Actionable**
   - Next steps
   - Risks
   - open follow-ups

7. **Artifacts**
   - artifact links only when safe
   - files touched as text unless explicitly safe/linkable

8. **Timeline**
   - recent events only by default
   - expandable raw detail if needed

9. **Footer CTA**
   - Back to dashboard
   - repeated full report / source-state affordance

### Copy changes

Use clearer labels:

- `Doing` → `Current focus`
- `Accomplished` → `Completed work`
- `Findings` → `Key findings`
- `Awaiting` → `Needs input`
- `Artifacts` → `Evidence & artifacts`
- `Risks` → `Risks / blockers`

State copy:

- **Full report not generated yet** — “This worker has ledger details, but no structured report artifact was recorded.”
- **Derived from ledger** — “Built from worker status, summary, events, and artifacts.”
- **Missing report artifact** — “A report was referenced but could not be loaded. Showing ledger-derived fallback.”
- **Stale report** — “Report may be older than the latest worker/run update.”

## Safety and trust requirements

### Provenance

Every rich section should be visibly sourced:

- Report
- Ledger
- Event
- Artifact
- Derived

This can be subtle per-section metadata, not noisy per-line badges everywhere.

### Freshness

Compare:

- `reportUpdatedAt`
- report artifact `updatedAt` if present
- `worker.lastSeenAt`
- `run.updatedAt`

Flag stale if report is older than meaningful worker/run changes.

### Path safety

CLI is the primary enforcement point.

Report paths should:

- be relative
- not contain `..`
- not be absolute
- not be URL-like
- ideally live under `reports/`
- be checked for existence when claiming `reportStatus: final`

Browser should defensively reject suspicious paths too.

### Render safety

- Use `textContent` / `createElement` only for worker/report text.
- Never inject report fields with `innerHTML`.
- Separate text fields from link fields.
- Do not make arbitrary `filesTouched` strings clickable.

## Automation strategy

Do not require every worker to manually maintain report JSON from day one. That will fail adoption.

Build in phases:

### Phase 1 — Trustworthy derived detail

- Implement `deriveWorkerDetailView(worker, run, reportData, reportLoadError)`.
- Add source/freshness/missing-report badges.
- Ensure no-report workers render meaningful detail.
- Keep all changes additive/backcompatible.

### Phase 2 — Schema and path hardening

- Tighten report schema and CLI validations.
- Require report artifact path for `reportStatus: final` when claiming a full report.
- Add browser-side defensive path checks.

### Phase 3 — UX polish

- Redesign worker detail page around Snapshot / Generated / Derived / Actionable / Artifacts / Timeline.
- Ensure full report CTA/source state is visible without scrolling.
- Add stable loading skeletons to prevent page jump.

### Phase 4 — Tests before automation

Add fixtures and tests for:

- old run with no report metadata
- new run with full report
- hybrid report + ledger fallback
- missing report artifact
- stale report
- unsafe text/XSS strings
- path traversal attempts
- long mobile content at 375px

### Phase 5 — Report automation

- Update worker prompts/templates to require structured output sections.
- Add coordinator/reconcile hooks to persist structured worker output into report artifacts.
- On worker completion, write/refresh report artifact and update ledger metadata.
- Keep derived fallback for older or failed runs.

## Acceptance checklist

### User-visible

- [ ] Every worker row has an obvious full-detail affordance.
- [ ] Full worker page always has non-empty useful content for old/no-report workers.
- [ ] User can tell full report vs hybrid vs ledger-derived at a glance.
- [ ] Missing report is explained, not silently blank.
- [ ] Stale/partial/final states are visible.
- [ ] No nested scroll traps on mobile.
- [ ] No page shift while reading.
- [ ] Full report / source state visible in first viewport.

### Data/trust

- [ ] Derived content does not invent files, findings, conclusions, or verification.
- [ ] Report artifact fields override derived fallback for report-owned sections.
- [ ] CLI rejects unsafe `reportPath` values.
- [ ] Browser defensively refuses suspicious report paths.
- [ ] `filesTouched` renders as text unless explicitly modeled as safe links.
- [ ] Old run ledgers still load.

### Tests

- [ ] Schema validation passes for old and new fixtures.
- [ ] CLI report flags still validate headline/bullet bounds.
- [ ] Repeated `--report-bullet` works.
- [ ] `../`, absolute, URL, and encoded traversal paths are rejected.
- [ ] Worker page renders no-report worker with useful derived sections.
- [ ] Missing report artifact creates risk + fallback.
- [ ] Full report artifact wins over fallback.
- [ ] Unsafe report text is escaped.
- [ ] 375px mobile screenshot/inspection passes.

## Concrete implementation files

Likely files to change:

- `dashboard/worker.js`
  - add derive helper
  - merge report/ledger/event data
  - source/freshness logic
  - safer list rendering

- `dashboard/worker.html`
  - add source/freshness badge area
  - optionally restructure section headings

- `dashboard/worker.css`
  - mobile-first snapshot card
  - source badges
  - stable loading/error states

- `dashboard/app.js`
  - keep preview compact
  - ensure full report/detail CTA visible for all workers
  - avoid redundant chips

- `scripts/apiary-run.mjs`
  - tighten `reportPath` validation
  - optional final-report artifact invariant

- `protocol/run-ledger.schema.json`
  - keep report metadata optional/additive
  - document preview fields

- `schema/report-schema.json`
  - align full report artifact with worker detail view

- `templates/worker-output.yaml`
  - include structured sections workers should emit

- `prompts/*worker.md`
  - require concise structured worker output and evidence/artifact references

- tests / fixtures
  - add old/no-report/full/hybrid/missing/stale/unsafe fixtures

## Final recommendation

Ship this as a trust-first reporting system:

1. **Immediate:** Make every worker detail page meaningful via ledger-derived fallback and source labels.
2. **Next:** Harden schema/path/render safety and add test fixtures.
3. **Then:** Automate structured report capture from worker outputs.
4. **Only after that:** Claim “complete worker reports.”

The product promise should be:

> “Every worker page shows all available worker information, with clear source, freshness, and missing-data states.”

Not:

> “Every worker has a complete generated report.”

That distinction keeps the dashboard useful without making it deceptively confident.
