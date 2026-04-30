# OpenClaw Adapter

Map Apiary to OpenClaw/Dexter:

- Coordinator: main Dexter session.
- Scouts: `sessions_spawn` with isolated/light context.
- Retrieval: `rg`, QMD, `read`, `web_fetch`, `web_search`.
- Substrate: `MEMORY.md`, `memory/YYYY-MM-DD.md`, `projects/runbooks/`, project docs, Obsidian if configured.
- Verification: tests, lint, build, dry run, screenshot, source inspection, reviewer scout.

Default:
- 1-3 scouts maximum.
- Cheap model for bounded scouts.
- Devil's advocate for adoption/security/automation decisions.
- Dexter synthesizes; do not paste raw scout output.
