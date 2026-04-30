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

See also: [`../../protocol/model-routing.md`](../../protocol/model-routing.md).
