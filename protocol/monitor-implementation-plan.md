# Apiary Monitor Implementation Plan

A lightweight, provider/runtime-agnostic monitor for Apiary swarms.

Goal: make Apiary runs visible in terminal and a friendly visual dashboard without adding a daemon, database, framework, or cloud dependency.

## Principles

- **OpenClaw/runtime agnostic:** OpenClaw provides sessions/events; Apiary normalizes them into its own run ledger.
- **No always-on daemon for MVP:** logging is event-driven by scripts; dashboards read files.
- **Local and air-gapped friendly:** plain JSON, static HTML/CSS/JS, Node scripts only.
- **Read-only first:** monitor state; do not mutate/kill/retry tasks from the dashboard until schema is stable.
- **Cute but truthful:** animations reflect explicit states; never hide blockers/staleness behind happy visuals.
- **Privacy-safe by default:** no raw logs or sensitive snippets in overview; reveal details intentionally.
- **Accessible:** text labels + icons + color; reduced motion; keyboard-friendly.

## Architecture

```text
Runtime adapter, e.g. OpenClaw
  └─ emits/observes session + subagent events

Apiary logger scripts
  └─ normalize events into Apiary run ledger JSON

Apiary monitor readers
  ├─ terminal monitor reads ledger JSON
  └─ static dashboard reads ledger JSON
```

OpenClaw should not know about Hive Board UI. The dashboard should not parse raw OpenClaw internals. The stable contract is the Apiary run ledger schema.

## File layout

```text
projects/apiary-protocol/
  protocol/
    monitor-implementation-plan.md
    run-ledger.schema.json
  runs/
    registry.json
    run-<id>.json
  dashboard/
    index.html
    styles.css
    app.js
    sample-data.js              # optional offline/file:// fallback
  scripts/
    apiary-run.mjs              # event-driven ledger writer
    apiary-monitor.mjs          # terminal monitor
    apiary-serve-monitor.mjs    # optional tiny static server, no deps
  tests/unit/
    run-ledger.test.mjs
    model-router.test.mjs
  tests/fixtures/
    registry.sample.json
    run.sample.json
```

`runs/` may be gitignored later if run history should remain local/private. Sample fixtures should be committed.

## Ledger schema v1

### Registry

`runs/registry.json`

```json
{
  "schemaVersion": "apiary.registry.v1",
  "generatedAt": "2026-04-30T01:32:00.000Z",
  "latestRunId": "run-20260429-1832-monitor",
  "runs": [
    {
      "runId": "run-20260429-1832-monitor",
      "title": "Apiary monitor implementation plan",
      "status": "running",
      "createdAt": "2026-04-30T01:32:00.000Z",
      "updatedAt": "2026-04-30T01:35:00.000Z",
      "path": "runs/run-20260429-1832-monitor.json",
      "summary": {
        "total": 3,
        "queued": 0,
        "running": 1,
        "waiting": 0,
        "blocked": 0,
        "done": 2,
        "failed": 0,
        "canceled": 0,
        "stale": 0
      }
    }
  ]
}
```

### Run ledger

`runs/run-<id>.json`

```json
{
  "schemaVersion": "apiary.run.v1",
  "runId": "run-20260429-1832-monitor",
  "title": "Apiary monitor implementation plan",
  "status": "running",
  "privacyMode": true,
  "createdAt": "2026-04-30T01:32:00.000Z",
  "updatedAt": "2026-04-30T01:35:00.000Z",
  "coordinator": {
    "adapter": "openclaw",
    "label": "Dexter"
  },
  "scouts": [
    {
      "id": "ux-scout",
      "label": "Dashboard UX scout",
      "role": "uxScout",
      "modelRole": "cheapScout",
      "model": "openai-codex/gpt-5.4-mini",
      "status": "done",
      "sessionKey": "agent:main:subagent:...",
      "startedAt": "2026-04-30T01:33:00.000Z",
      "lastSeenAt": "2026-04-30T01:34:00.000Z",
      "completedAt": "2026-04-30T01:34:00.000Z",
      "progress": 100,
      "summary": "Proposed Hive Board metaphor.",
      "awaiting": null,
      "artifactPaths": []
    }
  ],
  "events": [
    {
      "id": "evt-001",
      "ts": "2026-04-30T01:33:00.000Z",
      "type": "state",
      "severity": "info",
      "scoutId": "ux-scout",
      "message": "Scout started."
    }
  ],
  "decisionAwaiting": null
}
```

## Status enums

Run/scout statuses:

```text
queued | running | waiting_tool | waiting_user | blocked | retrying | done | failed | canceled | stale
```

Dashboard may group `waiting_tool` and `waiting_user` under a friendly `waiting` count, but the raw schema should keep them distinct.

Event types:

```text
state | log | heartbeat | warning | error | artifact | decision
```

Severities:

```text
info | success | warning | danger
```

## Scripts

### `scripts/apiary-run.mjs`

Purpose: create and update ledgers atomically.

Commands:

```bash
node scripts/apiary-run.mjs start \
  --title "Dashboard design" \
  --adapter openclaw

node scripts/apiary-run.mjs scout-start \
  --run <run-id> \
  --id ux-scout \
  --label "Dashboard UX scout" \
  --role uxScout \
  --model-role cheapScout \
  --model openai-codex/gpt-5.4-mini \
  --session-key agent:main:subagent:...

node scripts/apiary-run.mjs scout-update \
  --run <run-id> \
  --id ux-scout \
  --status running \
  --summary "Gathering UX patterns"

node scripts/apiary-run.mjs scout-complete \
  --run <run-id> \
  --id ux-scout \
  --summary "Proposed Hive Board metaphor."

node scripts/apiary-run.mjs scout-fail \
  --run <run-id> \
  --id ux-scout \
  --message "Model unavailable; fallback failed."

node scripts/apiary-run.mjs event \
  --run <run-id> \
  --type warning \
  --message "Reviewer waiting on user decision."

node scripts/apiary-run.mjs complete --run <run-id>
```

Implementation details:

- Use only Node built-ins.
- Write temp file beside target, then `rename` atomically.
- Recompute registry summary after every write.
- Preserve event history append-only.
- Validate status enums before writing.
- Redact or omit raw scout content by default.

### `scripts/apiary-monitor.mjs`

Purpose: terminal reader.

Commands:

```bash
node scripts/apiary-monitor.mjs
node scripts/apiary-monitor.mjs --run <run-id>
node scripts/apiary-monitor.mjs --watch --interval 3
```

Output:

```text
APIARY HIVE — latest
Status: running · 2 done · 1 running · 0 blocked · updated 12s ago

ROLE        LABEL                  MODEL ROLE    MODEL/ROUTE       STATUS
uxScout     Dashboard UX scout     cheapScout    gpt-5.4-mini      done
techScout   Dashboard tech scout   cheapScout    gpt-5.4-mini      running
reviewer    Risk scout             reviewer      host-default      done

Awaiting: none
```

No curses/TUI dependency. Plain ANSI optional.

### `scripts/apiary-serve-monitor.mjs` optional

Tiny local static server using Node `http` only:

```bash
node scripts/apiary-serve-monitor.mjs --port 8765
```

Serves `dashboard/` and `runs/`. Optional; dashboard can also be exposed through OpenClaw/Tailscale later.

## Visual dashboard MVP

### UI concept: Hive Board

- Top: Hive Health summary
  - running / waiting / blocked / done / failed
  - last refresh
  - privacy mode indicator
- Main: honeycomb scout cells
  - each cell = one scout/subagent
  - state shown by icon + label + color + subtle animation
- Side panel: selected scout details
  - plain-language objective
  - status
  - model role and route
  - last seen
  - summary
  - awaiting/blocked reason
- Bottom: recent event timeline

### Friendly state labels

```text
queued        -> Queued
running       -> Gathering
waiting_tool  -> Waiting on tool
waiting_user  -> Waiting for you
blocked       -> Blocked
retrying      -> Trying again
stale         -> Quiet too long
failed        -> Failed
canceled      -> Canceled
done          -> Finished
```

### Animation rules

- `running`: gentle shimmer/buzz.
- `queued`: calm idle pulse.
- `blocked`: subtle wobble + warning icon.
- `retrying`: small loop arrow pulse.
- `done`: one brief sparkle, then static.
- `stale`: faded/desaturated.
- Respect `prefers-reduced-motion` and provide a Focus Mode toggle.

### Privacy mode

Default overview should avoid sensitive details:

- show scout labels and generic summaries only
- hide raw paths, snippets, and tool outputs
- details reveal requires explicit click/toggle
- add `privacyMode: true` to run ledger

## Dashboard implementation

- `index.html`: semantic layout.
- `styles.css`: honeycomb, themes, reduced motion, high contrast.
- `app.js`:
  - fetch `../runs/registry.json`
  - load latest or selected run
  - render summary, cells, side panel, timeline
  - poll every 3 seconds while visible
  - manual refresh button
  - stale detection client-side using `lastSeenAt`

No framework, no package install, no bundler.

## Testing plan

### Unit tests

`tests/unit/run-ledger.test.mjs`

Cases:

1. start creates valid run + registry
2. scout-start adds scout and running summary
3. scout-complete updates status, progress, summary
4. scout-fail records failure event
5. invalid status is rejected
6. registry summary counts statuses correctly
7. stale detection helper marks old `lastSeenAt`
8. atomic write does not leave partial target on success path

### Dashboard smoke tests

Keep simple:

- fixture registry/run loads in a browser
- app renders expected count text
- selecting a scout opens side panel
- reduced-motion CSS present
- privacy mode hides details by default

Can start with manual smoke plus a tiny Node test for pure rendering helper functions if app code is modular.

## Implementation phases

### Phase 1 — Ledger writer + terminal monitor

Deliver:

- `protocol/run-ledger.schema.json`
- `scripts/apiary-run.mjs`
- `scripts/apiary-monitor.mjs`
- sample fixtures
- unit tests

Acceptance:

- Can start a run, add scouts, complete/fail scouts, complete run.
- Terminal monitor shows latest run accurately.
- Tests pass with Node built-in test runner.

### Phase 2 — Static visual dashboard MVP

Deliver:

- `dashboard/index.html`
- `dashboard/styles.css`
- `dashboard/app.js`
- sample data mode
- privacy mode
- stale markers
- reduced motion

Acceptance:

- Opens locally through static server.
- Shows hive health, honeycomb scout cells, event timeline.
- Polls JSON and updates after ledger script changes.
- No external network or dependencies.

### Phase 3 — Dexter/OpenClaw adapter integration

Deliver:

- Update local Apiary skill to call `apiary-run.mjs` before/after scout spawn/completion.
- Document OpenClaw mapping:
  - `sessions_spawn accepted` -> `scout-start`
  - completion success -> `scout-complete`
  - completion failure -> `scout-fail`
  - user decision needed -> `waiting_user`

Acceptance:

- A real Apiary run writes a ledger as it happens.
- Terminal/dashboard show the same state.
- If a subagent completion arrives later, ledger updates rather than duplicating.

### Phase 4 — Polish

Deliver:

- cute bee/hive animations
- focus mode
- high contrast theme
- basic dashboard screenshots/docs
- optional static server convenience script

Acceptance:

- Fun enough to feel alive.
- Calm enough to be operationally useful.
- No material CPU/memory hogging.

## First build slice recommendation

Build Phase 1 first. Then immediately test it with one real two-scout Apiary run. Only after the ledger is trustworthy should we build the cute dashboard on top.

Suggested first command flow:

```bash
RUN_ID=$(node scripts/apiary-run.mjs start --title "Monitor MVP test" --adapter openclaw --json | jq -r .runId)
node scripts/apiary-run.mjs scout-start --run "$RUN_ID" --id ux --label "UX scout" --role uxScout --model-role cheapScout
node scripts/apiary-run.mjs scout-complete --run "$RUN_ID" --id ux --summary "Hive Board direction validated."
node scripts/apiary-monitor.mjs --run "$RUN_ID"
```

If avoiding `jq`, the script should also print a plain `runId` mode.

## Open questions

- Should local run ledgers be gitignored by default? Recommendation: yes, except fixtures.
- Should summaries be redacted by default? Recommendation: yes for dashboard overview; full details optional.
- Should dashboard expose action buttons? Recommendation: no for MVP.
- Should dashboard live inside public Apiary repo? Recommendation: yes, as a static optional adapter/viewer.
