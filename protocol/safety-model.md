# Apiary Safety Model

## Baseline safety

Apiary must not override the host environment's safety rules.

Require explicit approval for:
- destructive actions,
- external sends/posts/purchases/API writes,
- credential or secret handling,
- permission/scope changes,
- installing software,
- modifying system config,
- broad file changes.

## Privacy minimization

Pass workers only the context they need.

Prefer:
- redacted excerpts,
- source summaries,
- isolated workspaces,
- explicit forbidden actions.

Avoid:
- raw private transcripts,
- credentials,
- personal data unrelated to the task,
- provider routing surprises.

## Verification before completion

No non-trivial Apiary run is complete until the coordinator states the verification gate or names the blocker.
