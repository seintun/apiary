# OpenClaw Apiary Monitor Adapter

This adapter keeps Apiary monitoring separate from OpenClaw internals.

OpenClaw provides sessions, subagents, model routing, and completion events. Apiary writes a normalized run ledger that terminal and visual monitors read.

## Event mapping

| OpenClaw moment | Apiary ledger command |
|---|---|
| Coordinator decides to use Apiary | `apiary-run start` |
| `sessions_spawn` accepted | `apiary-run worker-start` |
| Worker progress worth recording | `apiary-run worker-update` or `apiary-run event` |
| Worker completes successfully | `apiary-run worker-complete` |
| Worker fails | `apiary-run worker-fail` |
| Human decision needed | `apiary-run event --type decision` and status `waiting_user` |
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

# when completion event arrives
node scripts/apiary-run.mjs worker-complete \
  --run "$RUN_ID" \
  --id architecture \
  --summary "Found that v2 is a monorepo platform rewrite."
```

If a model role resolves to host/default, omit `--model` or pass no model to `sessions_spawn`. Record `--resolved-model` from OpenClaw session status when available; the monitor displays the actual resolved model id. If the runtime does not expose it yet, it displays `runtime-default (unresolved)` rather than pretending to know.

## View monitors

Terminal:

```bash
node scripts/apiary-monitor.mjs
node scripts/apiary-monitor.mjs --watch --interval 3
```

Visual dashboard:

```bash
node scripts/apiary-serve-monitor.mjs 8765
open http://localhost:8765
```

The dashboard is read-only, privacy-oriented, and uses the same ledger JSON as the terminal monitor.
