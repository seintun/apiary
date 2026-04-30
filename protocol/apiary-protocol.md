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
