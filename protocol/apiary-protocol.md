# Apiary Protocol

## Core protocol

Apiary is a lightweight multi-perspective decision workflow:

```text
Classify -> Retrieve -> Worker -> Synthesize -> Verify -> Writeback
```

## 1. Classify

Decide whether the task needs Apiary.

Use Apiary when:
- risk/tradeoffs are meaningful,
- independent perspectives reduce blind spots,
- evidence must be gathered from multiple places,
- the decision may become durable process/strategy.

Skip Apiary when:
- the task is simple,
- one direct lookup is enough,
- speed matters more than breadth,
- the user explicitly wants a quick answer.

## 2. Retrieve

Gather relevant source material before asking workers to speculate.

Examples:
- files/docs/wiki/search results,
- source code,
- issue threads,
- external docs,
- prior decisions.

Retrieval tools vary by environment. The invariant is: inspect sources before claiming confidence.

## 3. Worker

Assign 1-3 scoped workers.

Common worker roles:
- Research worker: facts, sources, prior art.
- Devil's advocate: risks, instability, privacy/security, overkill.
- Adaptation worker: how to implement in the current environment.
- Reviewer worker: review a proposed plan/diff/output.

Each worker gets:
- objective,
- constraints,
- allowed/forbidden actions,
- output schema,
- stop conditions.

For parallel implementation work, define a small contract before spawning workers. The contract should capture canonical field shapes, ownership boundaries, acceptance gates, fallback-model merge rules, and review requirements. Workers must conform to the contract or stop and report the mismatch.

## 4. Synthesize

The coordinator compares worker outputs and produces one decision.

Synthesis must identify:
- agreement,
- disagreement,
- evidence quality,
- unresolved risks,
- recommended action,
- verification gate,
- writeback destination.

Do not paste worker outputs as the final answer.

## 5. Verify

Use the smallest meaningful gate:
- source citation,
- test/lint/build,
- dry run,
- peer review,
- checklist,
- screenshot,
- human approval,
- explicit blocker.

For implementation runs, "done" means the gate passed, not merely that a worker reported completion. If workers complete outside the ledger, reconcile their lifecycle state before closing the run. Intentional non-terminal states such as `needs_review`, `needs_tests`, and `waiting_model` are preferable to letting work drift into stale/unknown status.

## 6. Writeback

Preserve only durable learning.

Examples:
- decision record,
- runbook/playbook,
- project note,
- issue comment,
- changelog,
- team wiki update.

Avoid saving raw worker transcripts unless required for audit.
