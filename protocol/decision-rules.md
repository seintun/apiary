# Apiary Decision Rules

## Worker count

- Direct answer: simple, low-risk tasks.
- 2 workers: moderate complexity or meaningful risk.
- 3 workers: broad/high-stakes planning or adoption decisions.
- More than 3 workers: requires explicit justification.

## Quorum sensing

If 2 of 3 workers agree with confidence >= medium, commit with caveats.

If one high-confidence worker has strong evidence and others do not conflict, commit cautiously or ask the user depending on stakes.

If workers disagree on substantive facts, spawn one targeted resolving worker. Do not spawn another generalist.

If a devil's advocate or reviewer flags a critical risk with concrete evidence, treat it as a weighted veto until resolved.

## Stop signal

If a devil's advocate/reviewer returns high-confidence `abandon` with concrete evidence, the coordinator may stop sibling workers unless they are nearly complete.

## Anti-overkill rule

If the synthesis step is taking longer than doing the task directly, stop and simplify.
