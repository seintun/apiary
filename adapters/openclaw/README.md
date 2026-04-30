# OpenClaw Adapter

Map Apiary to OpenClaw/Dexter:

- Coordinator: main Dexter session.
- Workers: `sessions_spawn` with isolated/light context.
- Retrieval: `rg`, QMD, `read`, `web_fetch`, `web_search`.
- Substrate: `MEMORY.md`, `memory/YYYY-MM-DD.md`, `projects/runbooks/`, project docs, Obsidian if configured.
- Verification: tests, lint, build, dry run, screenshot, source inspection, reviewer worker.

Default:
- 1-3 workers maximum.
- Use model roles, not hardcoded model names. Public/default OpenClaw Apiary should omit `model` and let OpenClaw route normally.
- Optional local preferences may map roles like `cheapWorker`, `strongJudge`, and `reviewer` to concrete models. Treat these as soft preferences unless the user explicitly requires one.
- If a soft preferred model fails, retry the same worker once with no explicit model so OpenClaw can use its default/fallback chain.
- For air-gapped/local-only setups, leave roles as `auto`/`default` and configure OpenClaw's default model/provider to the local runtime; Apiary should not require cloud model names.
- Devil's advocate for adoption/security/automation decisions.
- Dexter synthesizes; do not paste raw worker output.

Run ledger practice:
- Start a run with `scripts/apiary-run.mjs start` before spawning non-trivial workers.
- Record every spawned worker immediately with `worker-start`, including a stable id and `sessionKey`.
- When an OpenClaw subagent completion arrives, reconcile the Apiary worker with `apiary-run reconcile --run <run-id> --id <worker-id> --outcome success|failed|timeout --summary "..."`. Use direct `worker-complete` / `worker-fail` only when the coordinator is making the state transition itself.
- Use intentional wait states instead of accidental staleness: `waiting_user`, `waiting_model`, `needs_review`, and `needs_tests`.
- Run `sweep-stale` only for workers that should still be heartbeating.
- For implementation runs, use `../../templates/apiary-contract.json` before spawning workers and `../../checklists/merge-readiness-checklist.md` before commit/closeout.

See also: [`../../protocol/model-routing.md`](../../protocol/model-routing.md).
