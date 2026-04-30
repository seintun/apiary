# Apiary Technical Notes

## Implementation model

Apiary is implemented as a protocol pack:

```text
protocol/     normative workflow and rules
templates/    reusable input/output artifacts
prompts/      role prompts for coordinators and scouts
checklists/   verification and writeback aids
examples/     concrete worked examples
adapters/     platform-specific mappings
tests/        pressure scenarios for behavior validation
```

## Required dependencies

None.

Apiary can be run with only:
- markdown files,
- a coordinator,
- one or more scouts,
- a durable place to save decisions.

## Optional dependencies

Depending on adapter:
- shell/search tools,
- agent runtime with subagents,
- issue tracker,
- docs/wiki system,
- CI for validating examples,
- Python/Node for optional schema/checklist tooling.

## Data model

### Scout brief

Input contract for a scout:
- role,
- objective,
- context,
- allowed actions,
- forbidden actions,
- stop conditions,
- output format.

See `templates/scout-brief.md`.

### Scout output

Structured report with:
- objective restatement,
- direction/source path,
- effort estimate,
- atomic findings,
- evidence,
- confidence,
- recommendation,
- recruit/stop signals.

See `templates/scout-output.yaml`.

### Synthesis report

Coordinator-owned decision record:
- decision,
- scout input summary,
- agreement/disagreement,
- unresolved risks,
- verification gate,
- writeback destination.

See `templates/synthesis-report.md`.

## Adapter contract

Every adapter should define:
- how to run the coordinator,
- how to create scouts,
- where source retrieval happens,
- where durable writeback lives,
- what verification means,
- what requires approval,
- how over-swarming is prevented.

## Validation approach

Apiary is validated with pressure scenarios, not just happy-path examples.

Pressure scenarios test whether a coordinator:
- avoids over-swarming,
- respects privacy boundaries,
- honors stop signals,
- verifies before completion,
- writes back only durable learning.

See `tests/pressure-scenarios/`.

## Future optional tooling

Possible CLI helpers:

```bash
apiary init
apiary validate scout-output.yaml
apiary screen plan.md
apiary new tool-adoption-analysis
```

These are intentionally not required. The protocol should remain useful without software.
