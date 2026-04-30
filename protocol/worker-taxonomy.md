# Worker taxonomy

Apiary uses **workers** as the public term for specialized child agents in a swarm. “Scout” is now a legacy/internal alias only, kept where older ledger fields or command aliases need compatibility.

## Canonical worker types

| Worker type | Emoji | Use |
| --- | --- | --- |
| Research worker | 🔎🐝 | Gather sources, facts, prior art, and evidence. |
| Technical worker | 🛠️🐝 | Inspect code, architecture, implementation shape, and constraints. |
| UX worker | 🎨🐝 | Review interaction design, visual clarity, mobile ergonomics, and copy. |
| Risk / reviewer worker | 🛡️🐝 | Devil's advocate, security, privacy, maintainability, and failure-mode review. |
| Adaptation worker | 🧭🐝 | Map an idea into a local environment with minimal coupling. |
| Docs worker | 📚🐝 | Produce docs, runbooks, examples, and public-facing explanations. |
| Safety worker | 🦺🐝 | Check sensitive boundaries, exposure, permissions, and safe defaults. |
| Reliability worker | ✅🐝 | Verify tests, stale states, invariants, recovery, and operational behavior. |
| General worker | 🐝 | Default when no more specific category applies. |

## Naming rules

- Public docs, dashboard labels, and OpenClaw-facing instructions should say **worker**.
- Model roles should use `cheapWorker` and `balancedWorker`; `cheapScout` and `balancedScout` remain accepted aliases for older local configs.
- CLI examples should use `worker-start`, `worker-update`, `worker-complete`, and `worker-fail`; `scout-*` remains accepted as a legacy alias.
- Ledger JSON may retain `scouts` / `scoutId` fields until a schema migration is worth the churn. UI and docs should describe those records as workers.
