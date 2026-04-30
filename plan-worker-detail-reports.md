# Apiary Worker Detail Reports — Superpowers Plan

**Goal**
Workers should show concise, structured progress on the dashboard and allow diving into a full report page. Keep ledger small, privacy-safe, and mobile-friendly.

**Guiding constraints**
- Don’t bloat `runs/*.json` with transcripts.
- Don’t break existing runs.
- Dashboard stays fast on mobile.
- Full report optional; default flow unchanged.
- Respect existing `polling` (3s auto-refresh) and theme (buzz/honey).

---

## Phase 0 — Baseline & validation

**Task**: Inspect current behavior and lock acceptance criteria.

- Read current files:
  - `projects/apiary-protocol/scripts/apiary-run.mjs`
  - `projects/apiary-protocol/protocol/run-ledger.schema.json`
  - `projects/apiary-protocol/dashboard/app.js`
  - `projects/apiary-protocol/dashboard/styles.css`
- Confirm polling: `setInterval(loadRun, 3000)` works and registry fetch is capped to 24.
- Record current worker row UI contents and mobile CSS constraints.
- Acceptance criteria:
  - Existing runs load unchanged.
  - Mobile table width stays within viewport at 375px.
  - No `innerHTML` used for worker fields.

**Output**: `projects/apiary-protocol/validation-baseline.md` with screenshots or notes.

---

## Phase 1 — Ledger schema extension (no breaking changes)

**Task**: Add optional report metadata fields to ledger schema.

**File**: `protocol/run-ledger.schema.json`

- Keep `additionalProperties: false` at top level; add new optional fields under `scouts[]`:
  - `reportHeadline?: string` (max 120 chars conceptually)
  - `reportBullets?: string[]` (max 5 items, each max 120 chars)
  - `reportPath?: string` (local safe path to artifact file)
  - `reportUpdatedAt?: string` (ISO)
  - `reportStatus?: "partial" | "final"` (optional)
- No required changes; old runs validate fine.

**Acceptance**: JSON schema test with fixture from Phase 0 passes.

---

## Phase 2 — CLI update (apiary-run.mjs)

**Task**: Extend writer to accept and persist report metadata.

**File**: `scripts/apiary-run.mjs`

- Keep existing `worker-complete --summary "…"`, `worker-update --summary "…"` 100% compatible.
- Add new optional flags (for `worker-update` and/or `worker-complete`):
  - `--report-headline "…" `
  - `--report-bullet "…" ` (repeatable; stored as array)
  - `--report-path "reports/run-<runId>-<workerId>.json"` 
  - `--report-status partial|final`
- Validate:
  - `--report-path` stays within project directory and is not absolute outside.
  - Bullet count ≤ 5, headline ≤ 120 chars.
- Persist: updates the matching scout entry in the active run JSON file (append-only safe update).

**Acceptance**:
- Run a mini Apiary task (subagent) that calls `worker-update --report-headline "…" --report-bullet "…" --report-bullet "…"`.
- Read back the run JSON and confirm fields present.
- Ensure existing `--summary`-only runs still create valid files.

---

## Phase 3 — Report artifact format

**Task**: Decide and document the full report file structure.

**Artifact path**: `projects/apiary-protocol/reports/<runId>-<workerId>.json` (or `.md` for human-readable).

**JSON schema** (separate file, not in ledger):
```json
{
  "runId": string,
  "workerId": string,
  "headline": string,
  "doing": string,
  "accomplished": string[],
  "findings": string[],
  "artifacts": { label, path, kind }[],
  "filesTouched": string[],
  "nextSteps": string[],
  "risks": string[],
  "createdAt": string,
  "updatedAt": string
}
```

- Keep each field bounded (max items/length) to prevent giant files.
- CLI records `--report-path` in the ledger; the worker/coordinator writes the full report artifact file at that path.

**Acceptance**: Sample report renders cleanly in proposed detail page.

---

## Phase 4 — Dashboard inline preview

**File**: `dashboard/app.js`, `dashboard/styles.css`

- In `appendInlineDetails` or new `appendReportPreview`:
  - If `scout.reportHeadline` exists, show as bold line.
  - If `scout.reportBullets` exists (array), render up to 3 bullets as `<ul class="report-preview">`.
  - Add **“View full report”** button/link with class `.view-report-btn`.
  - Wire button to `openReportPage(scout.id)` which opens `worker.html?run=…&worker=…` in a new tab/window.
- Hide entire preview block if no report fields.
- Mobile: collapse preview by default with a “Show preview” toggle; keep row height minimal.

**Acceptance**:
- Worker with report shows preview + button.
- Worker without report shows no extra empty space.
- Mobile Chrome devtools 375px: table still scrollable horizontally, row height ≤ 3 lines of preview.

---

## Phase 5 — Worker detail page (separate HTML)

**Files**: `dashboard/worker.html`, `dashboard/worker.js`, `dashboard/worker.css`

- Accepts query params `?run=<runId>&worker=<workerId>`.
- On load:
  - Fetch `../runs/registry.json` to locate run file.
  - Fetch run JSON, find worker.
  - If `worker.reportPath` exists and is local, fetch that JSON too and merge/override.
  - Render sections: Headline, Doing, Accomplished, Findings, Artifacts (links), Files touched, Next steps, Risks.
  - **Back to dashboard** link (`href="index.html"`).
- Safety:
  - Render all text with `textContent`, never `innerHTML` (except sanitized artifact list links).
  - If report file missing/fails, show banner “Full report not available” and fall back to ledger summary.
- Mobile-first layout: stack vertically, large tap targets.

**Acceptance**:
- Full worker report displays with all sections.
- Back link returns to dashboard with previous filter/scroll preserved (sessionStorage if needed).
- Missing/broken report degrades gracefully.

---

## Phase 6 — Monitor & auto-polling verification

**Task**: Confirm dashboard auto-refreshes; watch for update propagation latency.

- In `dashboard/app.js`, `setInterval(loadRun, 3000)` already present.
- Optional: add a small “live” indicator dot that pulses when new data arrives (compare `currentRun.updatedAt` with last render timestamp).
- Ensure `fetch(..., {cache: 'no-store'})` prevents caching.
- Test: update a worker via `apiary-run.mjs worker-update …` in another terminal; verify dashboard reflects within ≤ 3s.

**Acceptance**: Live updates appear without manual refresh.

---

## Phase 7 — Tests & documentation

**Tests**
- Add `tests/unit/run-ledger-report-fields.test.mjs`:
  - old fixture loads, new fixture with report loads, schema validation passes.
- Add `tests/unit/dashboard-report-preview.test.mjs`:
  - DOM snapshot with/without report; no empty placeholders.
- Add `tests/unit/worker-page-render.test.mjs`:
  - sample report JSON renders all sections; text escaped properly; missing file handling.

**Docs**
- Update `README.md` in apiary-protocol:
  - How to produce a full report: `worker-update --report-headline … --report-bullet … --report-path reports/…`
  - Report artifact guidelines (bounded fields, examples).
  - Dashboard usage: tap worker → preview → “View full report”.
- Mention privacy: reports stored locally; dashboard does not embed full report in registry fetch.

**Acceptance**: `npm test` (or `node --test`) passes; docs updated.

---

## Execution via Subagents (Superpowered orchestration)

**Approach**: One subagent per phase, small enough to be cheap but complete; wait for each before starting next.

| Phase | Subagent task summary | Model preference |
|-------|----------------------|------------------|
| 0 | Inspect current code, list files, confirm polling, produce baseline notes | `balancedWorker` |
| 1 | Edit `run-ledger.schema.json` with optional fields; write `phases/phase1-schema.json` stub and PR-ready diff | `cheapWorker` |
| 2 | Update `apiary-run.mjs` to handle new flags; add validation; write `phases/phase2-cli.mjs` diff | `cheapWorker` |
| 3 | Create report artifact schema + sample; document worker/coordinator report-file writing | `balancedWorker` |
| 4 | Modify `dashboard/app.js`/`.css` to render preview + button; mobile testing via browser autopreview or notes | `balancedWorker` |
| 5 | Build `worker.html` + `worker.js` + `worker.css`; wire back link; sanitize rendering | `balancedWorker` |
| 6 | Verify polling; add live dot if desired; manual smoke test procedure | `cheapWorker` |
| 7 | Write tests + docs | `balancedWorker` |

**Coordinator (main session) actions**
- Start run ledger: `RUN_ID=$(node apiary-run.mjs start --title "Worker detail MVP" …)`
- For each phase:
  - Spawn subagent with clear acceptance checklist.
  - Record `worker-start`/`worker-complete` in ledger.
  - Review delivered diff/plan before greenlighting next phase.
  - If phase fails, spawn a targeted fix-or-debug subagent with `model=balancedWorker`.
- After all phases, do a final integration pass: start a test Apiary run that emits report fields and verify end-to-end.

**Superpower discipline**
- Each phase produces a minimal, reviewable artifact: either a diff, a new file, or a test.
- No speculative “future” work; clamp scope to acceptance criteria.
- Verification before claiming done: open `http://localhost:8765` (monitor) or check `dashboard/index.html` render.
- If something makes the dashboard unusable, treat it as blocker and fix immediately.

---

---

## Quick start (if you want to begin now)

1. Confirm baseline:
```bash
open projects/apiary-protocol/dashboard/index.html
# or: open http://localhost:8765
```
2. I’ll spawn **Phase 0** subagent to catalog current state and produce baseline doc.
3. After you approve Phase 0 output, we proceed lockstep through Phase 1–7.

**Risks to watch**
- Schema migration headaches if we later add required fields → avoid by making everything optional.
- Mobile overflow → test early in Phase 4.
- Privacy leakage via `reportPath` → validate path within project dir only.
- Stale active workers with half-built reports → `reportStatus` helps; dashboard may show “partial” badge.

**Measures of done**
- Worker row indicates report available (preview badge).
- Click “View full report” → dedicated page with structured sections.
- Polling shows update within 3s.
- All existing runs still open without errors.
