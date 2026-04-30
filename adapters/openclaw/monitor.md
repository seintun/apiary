# OpenClaw Apiary Monitor Adapter

This adapter keeps Apiary monitoring separate from OpenClaw internals.

OpenClaw provides sessions, subagents, model routing, and completion events. Apiary writes a normalized run ledger that terminal and visual monitors read.

## Event mapping

| OpenClaw moment | Apiary ledger command |
|---|---|
| Coordinator decides to use Apiary | `apiary-run start` |
| `sessions_spawn` accepted | `apiary-run scout-start` |
| Scout progress worth recording | `apiary-run scout-update` or `apiary-run event` |
| Scout completes successfully | `apiary-run scout-complete` |
| Scout fails | `apiary-run scout-fail` |
| Human decision needed | `apiary-run event --type decision` and status `waiting_user` |
| Coordinator final synthesis complete | `apiary-run complete` |

## Recommended Dexter flow

```bash
RUN_ID=$(node scripts/apiary-run.mjs start --title "Repo comparison" --adapter openclaw --coordinator Dexter)

node scripts/apiary-run.mjs scout-start \
  --run "$RUN_ID" \
  --id architecture \
  --label "Architecture scout" \
  --role architectureScout \
  --model-role cheapScout \
  --model "$RESOLVED_MODEL" \
  --session-key "$CHILD_SESSION_KEY"

# when completion event arrives
node scripts/apiary-run.mjs scout-complete \
  --run "$RUN_ID" \
  --id architecture \
  --summary "Found that v2 is a monorepo platform rewrite."
```

If a model role resolves to host/default, omit `--model` or pass no model to `sessions_spawn`. The monitor will display `host-default`.

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
