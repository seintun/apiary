# Retrospective — Worker Detail Reports MVP

Date: 2026-04-30
Project: Apiary / Honey ComBoard
Commit: `ed87235 Add worker report details to Honey ComBoard`

## Outcome

The worker detail/report feature was completed and committed after GPT-5.5 review and corrective fixes.

Final verification:

- JS syntax checks passed:
  - `node --check dashboard/app.js`
  - `node --check dashboard/worker.js`
  - `node --check scripts/apiary-run.mjs`
- Unit/integration tests passed: `45/45`
- CLI smoke test confirmed canonical flat worker report fields:
  - `reportHeadline`
  - `reportBullets`
  - `reportPath`
  - `reportUpdatedAt`
  - `reportStatus`
- Apiary ledger was reconciled so all phase workers and the run are `done`.

## What went well

- Rickie noticed quality risk early and asked for a GPT rerun before accepting the work.
- The Apiary dashboard made stale/unfinished ledger state visible, which surfaced the coordination problem.
- GPT-5.5 review caught real blockers before merge:
  - syntax-breaking patch markers
  - schema/CLI/UI shape mismatch
  - weak path validation
  - broken repeated CLI args
  - incomplete schema bounds
  - shallow tests
- The final batch was committed only after tests passed.
- The final system is stronger than the first implementation: it now has tests, docs, schema bounds, CLI integration coverage, safe rendering checks, and worker-detail routing.

## What went wrong

### 1. Parallel workers diverged from a shared contract

The plan said report metadata should use flat fields:

- `reportHeadline`
- `reportBullets`
- `reportPath`
- `reportUpdatedAt`
- `reportStatus`

But one worker implemented nested `scout.report`, while schema/docs/tests expected flat fields. Dashboard preview and worker detail page then disagreed about where data lived.

Root cause: workers were launched with phase-specific instructions but without a single machine-checkable contract artifact that every phase had to import or validate against.

### 2. Lower-quality fallback work was treated as phase-complete too early

Phase 2 initially hit GPT limits and fell back to Kilocode Free. It produced plausible-looking code, but missed integration details:

- repeated `--report-bullet` flags were overwritten
- report data shape mismatched schema
- path validation used unsafe prefix checking

Root cause: subagent completion was treated as enough signal before a stronger review/test gate ran.

### 3. Patch text leaked into source

Literal leading `+` diff markers were written into `dashboard/app.js`, breaking dashboard JS.

Root cause: generated patch-like text was not applied through a reliable patch mechanism or immediately syntax-checked.

### 4. Ledger state and actual subagent state diverged

Some subagents completed, but their corresponding Apiary worker records were never marked `done`. The dashboard showed them as `Quiet too long`.

Root cause: manual coordinator responsibility to record `worker-complete` was easy to miss, especially with auto-announced subagent completions arriving while other work continued.

### 5. Tests initially verified intent more than runtime behavior

The first Phase 7 tests were mostly string-grep tests. They missed real syntax and integration failures.

Root cause: tests were generated late, after implementation drift already existed, and were not anchored to the canonical schema/CLI round-trip.

### 6. Docs temporarily overpromised behavior

Docs said CLI writes the full report file when `--report-path` is supplied, but actual implementation records the report path and expects worker/coordinator to write the full artifact.

Root cause: plan language and implementation scope diverged, and docs copied the aspirational plan rather than final behavior.

## Key lessons

### Contract first, implementation second

For any multi-worker Apiary task, create a small canonical contract file before parallel implementation begins. For this feature, the contract should have been:

- ledger report field shape
- CLI flag semantics
- report artifact responsibility
- path rules
- UI rendering expectations
- test gates

Every worker should have been told: do not invent alternate shapes; if the contract is insufficient, stop and ask/coordinator decides.

### Quality tiers must affect merge policy

Kilocode Free can draft mechanical code, but should not be treated as merge-quality for cross-file features. It needs mandatory GPT/reviewer pass before commit.

Recommended policy:

- **Cheap/free worker**: draft, scout, mechanical edits only.
- **GPT-5.5/reviewer**: contract enforcement, security/path logic, schema consistency, integration review.
- **Main coordinator**: final test and commit authority.

### Worker completion must be ledger-automated

If a subagent completion event arrives, the system should automatically mark the matching Apiary worker complete/fail when possible. Manual bookkeeping is too fragile.

### “Done” requires gates, not vibes

A phase is not complete when a worker says it is complete. It is complete when its acceptance gate passes.

Recommended gates:

- syntax gate for touched JS
- schema validation for written JSON
- CLI round-trip if CLI changed
- UI smoke/snapshot if dashboard changed
- final reviewer pass for cross-file consistency

### Dashboard stale state is useful, but it needs reconciliation controls

The dashboard was right to show stale workers. The missing piece is a coordinator/reaper tool that reconciles actual subagent state with ledger state.

## System improvements

### A. Add an Apiary contract gate

Before parallel phases, create `contracts/<run-id>.json` or `contracts/<feature>.md` with:

```json
{
  "canonicalFields": ["reportHeadline", "reportBullets", "reportPath", "reportUpdatedAt", "reportStatus"],
  "fieldShape": "flat-on-scout",
  "legacyCompatibility": ["scout.report optional read-only fallback"],
  "reportArtifactOwner": "worker-or-coordinator",
  "mustPass": ["node --check", "node --test", "cli-roundtrip"]
}
```

Every phase worker receives this file path and must state whether their output conforms.

### B. Add automatic worker lifecycle reconciliation

Implement `apiary-run reconcile-openclaw --run <id>` or similar:

- map `sessionKey` -> subagent status
- if subagent completed successfully, mark worker `done`
- if subagent failed/timed out, mark worker `failed`
- if still running but no heartbeat, mark `stale`
- if awaiting user, mark `waiting_user`

Also run this from the coordinator after each completion event.

### C. Add a completion event hook

When `subagent_announce` arrives:

1. extract target `session_key`
2. find matching Apiary run/worker by `sessionKey`
3. automatically call:
   - `worker-complete` on success
   - `worker-fail` on failure/timeout
4. attach concise summary

This prevents “actual done / ledger stale” mismatch.

### D. Make phase workers produce patches, not vaguely “changed files”

Workers should either:

- modify files directly and run a gate, or
- produce a unified diff only

But they should not paste patch fragments into normal text that can be copied incorrectly.

Coordinator rule: after any code worker, immediately run syntax check on touched files.

### E. Add a Review Worker as a required phase, not optional

For non-trivial Apiary runs:

1. implementation workers finish
2. reviewer reads actual files, not summaries
3. reviewer runs tests/checks
4. coordinator applies fixes
5. only then commit

Reviewer prompt must explicitly check:

- contract adherence
- schema/code/docs consistency
- security footguns
- stale worker lifecycle
- runtime syntax
- test quality

### F. Improve model routing policy for Apiary

Recommended default:

- cheap worker may inspect/draft
- strong reviewer required before commit if:
  - schema + code both changed
  - CLI + UI both changed
  - path/security logic changed
  - worker orchestration/ledger changed
  - any fallback model was used after a GPT limit

If GPT is rate-limited, pause or mark phase `waiting_model`, not silently accept lower-quality completion.

### G. Add “quality debt” state to the dashboard

Not all incomplete work is stale. Add a state like:

- `needs_review`
- `needs_tests`
- `waiting_model`

That would have been more accurate than letting some phase rows age into `Quiet too long`.

### H. Add a final merge checklist

Before commit:

- [ ] all Apiary workers terminal: `done`, `failed`, or `canceled`
- [ ] no `stale` workers unless intentionally unresolved
- [ ] reviewer pass completed
- [ ] touched JS passes `node --check`
- [ ] tests pass
- [ ] CLI smoke passes if CLI changed
- [ ] docs match implementation
- [ ] commit hash recorded in run summary

## Proposed Apiary run lifecycle v2

1. **Plan**
   - Write short contract + acceptance gates.

2. **Spawn**
   - Start workers with contract path and model role.
   - Record `worker-start` immediately with session key.

3. **Work**
   - Workers update `doing`, `reportHeadline`, and `reportBullets` periodically.

4. **Auto-reconcile**
   - Completion events update ledger automatically.

5. **Review**
   - Strong reviewer validates actual files and gates.

6. **Fix**
   - Coordinator or fix worker patches defects.

7. **Verify**
   - Run tests/smoke/syntax.

8. **Commit**
   - Only if all gates pass.

9. **Close run**
   - Mark all workers terminal.
   - Mark run complete.
   - Store final commit hash and summary.

## Action items

### Immediate

- [x] Fix stale workers in current run.
- [x] Commit tested feature.
- [x] Add this retrospective.

### Next implementation improvements

- [ ] Add `apiary-run reconcile` command.
- [ ] Add contract template for multi-worker runs.
- [ ] Add required reviewer phase template.
- [ ] Add merge checklist to Apiary docs/runbook.
- [ ] Add `needs_review`, `needs_tests`, and/or `waiting_model` worker statuses.
- [ ] Add dashboard banner if run has stale workers but corresponding subagents have completed.
- [ ] Add model fallback disclosure to worker rows: requested model, actual model, fallback reason if known.

## Bottom line

The feature shipped correctly only after review and repair. The system worked in the sense that dashboard visibility and GPT review caught the problems before final merge, but the process was too manual and too easy to desynchronize.

The next Apiary improvement should be lifecycle automation: completion-event reconciliation plus a mandatory contract/review gate. That will make the hivemind feel less like several helpful freelancers and more like a coordinated engineering organism.
