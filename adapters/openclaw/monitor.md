# OpenClaw Apiary Monitor Adapter

This adapter keeps Apiary monitoring separate from OpenClaw internals.

OpenClaw provides sessions, subagents, model routing, and completion events. Apiary writes a normalized run ledger that terminal and visual monitors read.

## Event mapping

| OpenClaw moment | Apiary ledger command |
|---|---|
| Coordinator decides to use Apiary | `apiary-run start` |
| `sessions_spawn` accepted | `apiary-run worker-start` |
| Worker progress worth recording | `apiary-run worker-update` or `apiary-run event` |
| Worker completes successfully via OpenClaw completion event | `apiary-run reconcile --outcome success` |
| Worker fails or times out via OpenClaw completion event | `apiary-run reconcile --outcome failed\|timeout` |
| Coordinator directly marks worker complete/fail | `apiary-run worker-complete` / `apiary-run worker-fail` |
| Human decision needed | `apiary-run event --type decision` and status `waiting_user` |
| Waiting for quota/model/review/tests | `worker-update --status waiting_model\|needs_review\|needs_tests` |
| Coordinator final synthesis complete | `apiary-run complete` |

## Recommended Dexter flow

```bash
RUN_ID=$(node scripts/apiary-run.mjs start --title "Repo comparison" --adapter openclaw --coordinator Dexter)

node scripts/apiary-run.mjs worker-start \
  --run "$RUN_ID" \
  --id architecture \
  --label "Architecture worker" \
  --role architectureWorker \
  --model-role cheapWorker \
  --model "$RESOLVED_MODEL" \
  --session-key "$CHILD_SESSION_KEY"

# when an OpenClaw completion event arrives
node scripts/apiary-run.mjs reconcile \
  --run "$RUN_ID" \
  --id architecture \
  --outcome success \
  --summary "Found that v2 is a monorepo platform rewrite."
```

If a model role resolves to host/default, omit `--model` or pass no model to `sessions_spawn`. Record `--resolved-model` from OpenClaw session status when available; the monitor displays the actual resolved model id. If the runtime does not expose it yet, it displays `runtime-default (unresolved)` rather than pretending to know.

For implementation runs, create/adapt `../../templates/apiary-contract.json` before spawning workers and check `../../checklists/merge-readiness-checklist.md` before committing or closing the run. If a preferred model is temporarily unavailable, use `waiting_model` rather than silently accepting lower-quality fallback output as merge-ready. Use `needs_review` and `needs_tests` for explicit quality gates.

## View monitors

Terminal:

```bash
node scripts/apiary-monitor.mjs
node scripts/apiary-monitor.mjs --watch --interval 3
```

Visual dashboard, **Honey ComBoard**:

```bash
node scripts/apiary-serve-monitor.mjs 8765
open http://localhost:8765
```

Honey ComBoard is read-only, privacy-oriented, mobile-friendly, and uses the same ledger JSON as the terminal monitor. The header controls are intentionally stateful: **Privacy** is display/glance privacy only, **Focus** disables motion and shows an on-state, and **Refresh** reloads the ledger with immediate tap feedback.

Zombie-worker prevention is built into the monitor path: before serving a run JSON file, Honey ComBoard invokes `apiary-run sweep-stale` with `APIARY_STALE_MINUTES` or a 5-minute default. `sweep-stale` is for workers that should still be heartbeating; use intentional states like `waiting_model`, `needs_review`, `needs_tests`, or `waiting_user` for known waits. Coordinators can also run it manually:

```bash
node scripts/apiary-run.mjs sweep-stale --run <run-id> --older-than-minutes 5
```
