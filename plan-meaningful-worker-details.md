# Meaningful Worker Detail Reports Plan

Date: 2026-04-30
Apiary run: `run-20260430-153818-meaningful-worker-detail-reports-design`

## Goal

Make worker detail pages useful even when a worker did not create a dedicated report artifact, while avoiding fake confidence. The page should clearly distinguish:

- **Full report**: worker/coordinator produced structured report artifact.
- **Hybrid**: full report plus ledger-derived context.
- **Ledger-derived**: useful fallback synthesized only from recorded run ledger fields/events.

## Design principles

1. Do not invent facts. Derive only from ledger fields, events, artifacts, and explicit report files.
2. Keep dashboard preview compact: headline, max 3 bullets, explicit full-report link.
3. Keep full detail opt-in on `worker.html`.
4. Prefer report artifact fields over derived fallback when both exist.
5. Label source and freshness so derived content is not mistaken for verified analysis.
6. Store bounded preview metadata in run ledgers; keep bulky report content in separate files.

## Canonical render shape

```ts
type WorkerDetailView = {
  headline: string
  doing: string
  accomplished: string[]
  findings: string[]
  artifacts: Array<{ label: string; path: string; kind?: string }>
  filesTouched: string[]
  nextSteps: string[]
  risks: string[]
  source: 'full-report' | 'hybrid' | 'ledger-derived'
  reportStatus?: 'partial' | 'final'
  reportUpdatedAt?: string
}
```

## Fallback rules

- `headline`: `reportHeadline` → report data headline → worker label → worker id.
- `doing`: report `doing` → worker summary → status-based default.
- `accomplished`: report `accomplished` → `[summary]` when worker is done → empty.
- `findings`: report `findings` → last 3 relevant worker events, clearly event-derived.
- `artifacts`: report `artifacts` → `worker.artifactPaths`.
- `filesTouched`: report `filesTouched` only; do not guess from logs unless explicit.
- `nextSteps`: report `nextSteps` → `awaiting` for waiting/blocked workers.
- `risks`: report `risks` → failed/blocked/stale/missing-report warnings.
- `source`: `full-report` if report artifact loaded, `hybrid` if report plus ledger fallback, otherwise `ledger-derived`.

## Implementation steps

1. Add `deriveWorkerDetailView(worker, run)` to `dashboard/worker.js`.
2. In `loadAndRender`, load `reportPath` if present, then pass `{ worker, run, reportData }` through the derive helper.
3. Refactor `renderWorker` to render the derived view instead of reading report fields directly.
4. Add a source/freshness badge to `worker.html` near the header:
   - `Full report`
   - `Hybrid report`
   - `Derived from ledger`
   - include `reportStatus` and `reportUpdatedAt` when present.
5. Keep missing report artifact visible: `Full report unavailable: <safe error>` in risks.
6. Keep all DOM writes text-safe (`textContent`, `createElement`), no HTML injection.
7. Document the behavior in README/dashboard docs.

## Tests / gates

Add or extend dashboard tests to cover:

- Worker with no `reportPath` still shows non-empty Accomplished and meaningful log-derived Findings.
- Done worker derives Accomplished from summary.
- Waiting/blocked/stale worker derives Next steps or Risks.
- Full report fields override derived fallback.
- Missing report file shows visible risk/fallback instead of blank sections.
- Old run ledgers remain compatible.
- Unsafe text is escaped/rendered as text, never raw HTML.
- CLI report flags still validate repeated `--report-bullet` and reject escaping `--report-path`.

Manual gate:

- Open a known no-report worker, e.g. Phase 1 Schema Extension, and confirm the page has useful derived sections plus a clear `Derived from ledger` badge.
- Open a worker with a report artifact and confirm report-owned sections still win.

## Risks and mitigations

- **Fake confidence:** label derived content and avoid analytical claims not in events/artifacts.
- **Stale data:** show age/status/report freshness in the header.
- **Schema drift:** keep one canonical render helper and tests from CLI → ledger → dashboard → worker page.
- **Mobile clutter:** keep rich content off the main table; full detail page only.
- **Privacy leakage:** keep report files local/tailnet, normalize links, and treat privacy mode as display-only.

## Recommended build order

1. Implement derived render helper and source badge.
2. Add compatibility tests around existing run fixtures.
3. Improve worker prompts/contract so future workers emit structured report artifacts.
4. Add coordinator/reconcile support to persist structured worker output automatically.
