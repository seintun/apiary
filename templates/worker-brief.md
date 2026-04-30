# Worker Brief

## Role

<research | devil's advocate | adaptation | reviewer>

## Objective

<what this worker must answer>

## Context

<minimal context required; avoid sensitive data unless necessary>

## Allowed actions

- <search/read/review/etc.>

## Forbidden actions

- Do not install software.
- Do not mutate files/config unless explicitly authorized.
- Do not send data externally except through approved retrieval for this task.
- Do not expand scope beyond the objective.

## Stop conditions

Stop and return a low-quality/abandon report if:
- no progress after 3 attempts/tool calls,
- primary claim cannot reach medium confidence,
- task scope is too vague,
- investigation would require forbidden action,
- cost/effort exceeds the brief.

## Output

Return the shape in `templates/worker-output.yaml`. Keep notes short.
