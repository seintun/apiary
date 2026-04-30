# Phase 0 — Baseline & Validation
**Apiary Protocol — Worker Dashboard**

**Scope:** `projects/apiary-protocol/`
**Inspected files:**
- `scripts/apiary-run.mjs` — run persistence, registry, sweep-stale
- `protocol/run-ledger.schema.json` — JSON schema for runs/scouts/events
- `dashboard/app.js` — browser UI, polling, worker table rendering
- `dashboard/styles.css` — mobile-first responsive CSS

---

## 1. Polling Behavior (confirmed)

| Checkpoint | Location | Detail |
|---|---|---|
| Polling interval | `dashboard/app.js:loadRun()` | `setInterval(()=>{ if(!document.hidden) loadRun() },3000)` — every 3 seconds while tab is visible |
| Cache control | `dashboard/app.js:fetchRun()` | `fetch(runPath(entry),{cache:'no-store'})` — no-store on every run fetch |
| Registry cap | `dashboard/app.js:loadRun()` | `const candidates = (reg.runs || []).slice(0, 24)` — only the latest **24** runs are considered for display |
| Registry fetch | `dashboard/app.js:loadRun()` | `fetch('../runs/registry.json',{cache:'no-store'})` — also no-store |
| Fallback | `dashboard/app.js:loadRun()` | On any fetch error, falls back to `window.APIARY_SAMPLE_RUN` |

**Behavior:** The dashboard polls the run registry and each candidate run file every 3 seconds when the page is visible. Each network request bypasses the HTTP cache. The registry is trimmed to the 24 most-recent runs; only those are polled. Failed fetches are silently dropped (candidates filtered with `checked.filter(Boolean)`). If none succeed, a sample run is shown.

---

## 2. Worker Row UI Contents (health table)

The worker list renders in the **Health** table and the **inline expansion** rows (mobile-first: table is hidden on very small screens, inline rows shown instead).

**Columns (desktop / health table):**

| Column | Content | Source |
|---|---|---|
| 1 — Worker | Icon (role-based emoji) + label | `workerIcon(scout)` mapping, `displayWorkerLabel(scout)` |
| 2 — State / Model | Status label (e.g. "Running", "Waiting on tool") **or** model short name when a filter is active | `labels[status]` or `shortModel(scout)` — switches when health cards are selected |
| 3 — Seen / Time | "Time ago" string (e.g. "13s ago", "5m") **or** elapsed duration when a filter is active | `age(scout.lastSeenAt)` or `duration(scout.startedAt, scout.completedAt)` |

**Status labels (from `app.js`):**
```
queued → Queued
running → Gathering
waiting_tool → Waiting on tool
waiting_user → Waiting for you
blocked → Blocked
retrying → Trying again
done → Finished
failed → Failed
canceled → Canceled
stale → Quiet too long
```

**Inline detail row (shown when a worker is selected):**
Expands below the table row with a 3-column grid of facts:
- State, Role, Model (role → resolved model), Seen, Time (elapsed), Awaiting
- Recent events (last 3) as a small ordered list
- Summary paragraph (`scout.summary`)

Rendered by `appendInlineDetails()`.

---

## 3. Mobile CSS Constraints

Mobile layout activates at **max-width: 820px** and has special handling at **≤ 380px**. Key constraints:

### 3.1 Viewport breakpoints
```css
/* Default: desktop (>820px) */
@media (max-width:820px) { /* mobile */ }
@media (max-width:380px) { /* very small phones */ }
```

### 3.2 Overflow containment (mobile)
- **Body & shell**: `overflow-x: hidden`, `width: 100%`, `max-width: 100%` — prevents horizontal scroll.
- **Tables**: `table-layout: fixed`, cell content `overflow: hidden; text-overflow: ellipsis`.
- **Chip row & run history**: horizontal scrolling enabled (`overflow-x: auto`) but scrollbars hidden (`::-webkit-scrollbar { display: none }`).
- **Provenance timeline**: vertical scrolling contained (`overscroll-behavior: contain`), max-height compressed (285px on mobile, 250px on ≤380px).

### 3.3 Grid layout changes (mobile)
- **Health cards**: 4-column grid (same as desktop) but narrower padding.
- **Workspace**: switches from `grid-template-columns: 1fr 320px` (two-column) to single column (`grid-template-columns: 1fr`).
- **Hive panel (worker grid)**: collapses from responsive auto-fit to `repeat(2, minmax(0, 1fr))` — exactly 2 workers per row on mobile, 1 per row on ≤380px.
- **Details panel**: re-ordered to top (`order: -1` on mobile when `.single` class is NOT applied — see below caveat).
- **Provenance board**: switches from `grid-template-columns: 300px 1fr` to single-column stack; history panel hidden on mobile (`.history-panel{display:none!important}`) and replaced by the horizontal **history strip** above the task panel.

### 3.4 Table visibility toggle
The health table (`<table class="health-table">`) is **hidden on very narrow screens** in favor of the inline detail rows via CSS:
```css
.workspace.single{display:none}  /* by default */
```
App.js toggles `workspace.single` when no worker is selected; when a worker is selected, `inline-detail-row` rows are appended to the table body. This provides a "list-first" mobile UX: tap a worker to expand inline, avoiding the separate details card.

### 3.5 Text compression & truncation
- Worker label: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` in table cells.
- Model cell: `max-width: 180px` (desktop), `max-width: 112px` (mobile) with ellipsis.
- Task title: `-webkit-line-clamp(2)` on mobile, line-clamp removed on ≤380px.
- Event summary (provenance): line-clamp(2) on mobile; full text visible in expanded details.
- Chip labels: `max-width: 118px` mobile, `104px` ≤380px, ellipsis applied.

### 3.6 Touch targets & spacing
- Buttons: minimum height 40px (mobile), 42px (desktop).
- Health cards: padding scaled down, border-radius 14–16px on mobile.
- Timeline event dots: smaller (22px) on mobile.

---

## 4. Schema Highlights (run-ledger.schema.json)

- **Run object** (`apiary.run.v1`): `runId`, `title`, `status` (enum: 10 states), `privacyMode`, timestamps (`createdAt`, `updatedAt`, `completedAt`), `coordinator` (adapter + label), `summary` (counts), `scouts[]`, `events[]`, `decisionAwaiting`, `finalized` (boolean, not in schema — used internally by `apiary-run.mjs`).
- **Scout object**: `id`, `label`, `role`, `modelRole`, `model`, `resolvedModel` (actual runtime model id), `status`, `sessionKey`, `startedAt`, `lastSeenAt`, `completedAt`, `progress` (0–100), `summary` (string), `awaiting` (string | null), `artifactPaths[]`.
- **Event object**: `id`, `ts`, `type` (state/log/heartbeat/warning/error/artifact/decision), `severity` (info/success/warning/danger), `scoutId?`, `message`.

Strict `additionalProperties: false` throughout.

---

## 5. Current Worker Row UI (snapshot)

When the dashboard renders with a valid run, the worker table body (`<tbody id="healthWorkers">`) contains one `<tr>` per visible scout (after `healthFilter`). Each row has:

```html
<tr class="{statusClass} {selected?(' selected'):''}"
    role="button"
    tabindex="0"
    aria-expanded="true|false"
    aria-label="{label}: {status}, last seen {age}">
  <td>
    <span class="health-icon">[emoji]</span>
    [Worker label]
  </td>
  <td>[State label | Model short name]</td>
  <td>[Age | Duration]</td>
</tr>
```

If `selectedId === scout.id`, an extra row follows immediately after:

```html
<tr class="inline-detail-row">
  <td colspan="3">
    <div class="inline-detail">
      <div class="inline-facts">
        [State, Role, Model, Seen, Time, Awaiting — each in a .inline-fact box]
      </div>
      <p class="inline-summary">[scout.summary]</p>
      <ol class="inline-events">
        <li><strong>[severity]</strong> · [time] · [message]</li>
        … (up to 3)
      </ol>
    </div>
  </td>
</tr>
```

---

## 6. Validation Checklist

| ✅ Item | Evidence |
|---|---|
| Polling every 3s | `setInterval(..., 3000)` in `app.js` |
| Cache disabled | `{cache:'no-store'}` on `fetch(..)` in `fetchRun()` and `loadRun()` |
| Registry limited to 24 | `.slice(0, 24)` in `loadRun()` |
| Worker row shows icon + label | Column 1: `health-icon span` + text node |
| Worker row shows state or model | Column 2: `healthFilter==='all' ? labels[status] : shortModel()` |
| Worker row shows time or duration | Column 3: `healthFilter==='all' ? age(scout.lastSeenAt) : duration(...)` |
| Mobile layout ≤820px | Multiple `@media (max-width:820px)` blocks in `styles.css` |
| Table overflow prevented | `table-layout: fixed` + cell ellipsis rules; overall `overflow-x: hidden` on shell |
| Hive (worker grid) constrained to 2-col on mobile | `.hive{grid-template-columns:repeat(2,minmax(0,1fr))}` inside mobile media block |
| Horizontal scrolling only where intended | `.chip-row`, `.run-history` have `overflow-x:auto`; others `overflow:hidden` |

---

## 7. Open Questions / Risks

- **Registry cap:** The cap is applied client-side after fetching `registry.json`. If the server maintains more than 24 entries, the excess are never polled. This is intentional for performance but means older runs require manual navigation (not represented in current UI).
- **Inline vs card:** The CSS rule `.workspace.single{display:none}` hides the separate details card by default. App.js only shows `.single` when … actually the rule is `.workspace.single{display:none}` and there's also `.workspace.single .details{display:block}`? No — the class `single` appears to be unused in the provided JS. Mobile UX relies on the table with inline rows, not the card.
- **Health filter state:** When a health card is selected, column 2 switches from status → model and column 3 switches from age → duration. This is reflected in the baseline.

---

*Generated by Phase-0 subagent — baseline capture only; no files were modified.*
