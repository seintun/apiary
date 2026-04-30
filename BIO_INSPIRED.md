# Bio-Inspired Design

Apiary borrows mechanisms from biological collective intelligence because they solve the same problems multi-agent AI workflows face: exploration cost, noisy signals, stale memory, local autonomy, negative feedback, and convergence.

The metaphor is not decoration. Each mechanism maps to an engineering behavior.

## Master correlation matrix

| Bio pattern | Natural function | Apiary system pattern | Generic mechanism | Status |
|---|---|---|---|---|
| Queen pheromone | Identity/coherence signal | Coordinator authority | Human/AI lead owns final synthesis | Core |
| Worker bees / foragers | Parallel exploration | Scouts | Agents, humans, chats, reviewers, CI jobs | Core |
| Stigmergy | Trace-based coordination | Durable substrate | Docs, wiki, repo, notes, decision log | Core |
| Waggle dance | Structured location/quality report | Scout output schema | YAML/JSON/markdown report | Core |
| Apoptosis | Self-termination | Scout stop conditions | Scope/cost/confidence limits | Core |
| Stop signal | Negative feedback | Abort bad paths | Devil's advocate/reviewer veto | Core |
| Quorum sensing | Evidence-weighted convergence | Decision threshold | 2-of-3, targeted resolving scout | Core |
| Adaptive immunity | Learned defense | Devil's advocate | Risk/security/privacy review | Core |
| Innate immunity | Cheap generic defense | Plan screen | Checklist/static checks | Optional |
| Pheromone decay | Memory aging | Review/prune durable knowledge | Docs review, archive, decay metadata | Optional |
| Symbiosis | Stable specialist relationship | Persistent specialist | Domain expert, recurring agent/session | Optional |
| Mycelium / pull-based flow | Nutrients move on demand | Lazy context loading | Minimal context, source retrieval first | Principle |
| Circadian rhythm | Phased cycles | Workflow stages | Classify -> retrieve -> scout -> synthesize -> verify -> writeback | Principle |

## Practical mechanism summary

| Mechanism | Apiary behavior |
|---|---|
| Foraging | Use bounded scouts for independent perspectives |
| Waggle dance | Require structured scout reports for non-trivial runs |
| Apoptosis | Stop scouts that are stuck, unsafe, or out of scope |
| Stop signal | Let strong risk evidence pause or abort a bad path |
| Quorum sensing | Commit when enough independent evidence converges |
| Stigmergy | Save durable decisions to docs/runbooks/issues |
| Pheromone decay | Periodically review stale durable knowledge |
| Innate immunity | Use cheap checklists before expensive review |
| Adaptive immunity | Use devil's advocate for subtle contextual risk |

## Guardrail

Do not overextend the metaphor. If a biological analogy does not produce a clearer workflow, skip it.
