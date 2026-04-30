# Apiary Merge Readiness Checklist

Use this before committing or marking an Apiary run complete.

## Lifecycle

- [ ] Every worker has a terminal or intentional waiting state.
- [ ] No worker is accidentally `stale`.
- [ ] If a worker completed externally, ledger was reconciled with `apiary-run reconcile`.
- [ ] Run summary matches actual worker states.

## Contract

- [ ] A contract exists for multi-worker implementation work.
- [ ] Schema, CLI, UI, docs, and tests use the same canonical field shape.
- [ ] Any deviation from the contract is documented and reviewed.

## Quality gates

- [ ] Touched JavaScript passes `node --check`.
- [ ] Tests pass.
- [ ] CLI round-trip test passes if CLI changed.
- [ ] JSON artifacts parse and validate if schemas changed.
- [ ] UI/dashboard behavior was smoke-tested or covered by tests.

## Review

- [ ] Strong reviewer inspected actual files, not only worker summaries.
- [ ] Fallback/cheap-model work received strong review before merge.
- [ ] Security-sensitive logic received explicit review.

## Docs and closeout

- [ ] Docs match implemented behavior.
- [ ] Final commit hash is recorded in the run summary or retrospective.
- [ ] Run was marked complete only after all gates passed.
