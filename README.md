# Apiary Protocol

A portable hivemind workflow for AI agents and teams.

Apiary helps a coordinator use multiple scouts to explore, challenge, synthesize, verify, and preserve decisions — without requiring a new runtime, LLM provider, database, or tool stack.

> Coordinated scouts, structured synthesis, durable learning — without a new runtime.


## Why "Apiary"?

An apiary is a place where hives are kept. That maps cleanly to the workflow:

- **Coordinator / keeper:** the human or AI responsible for final judgment.
- **Scouts / foragers:** independent agents, chats, humans, or reviewers exploring bounded questions.
- **Comb / substrate:** the durable place where useful decisions and procedures are written back.
- **Waggle dance:** structured scout reports that communicate direction, evidence, confidence, and recommendation.
- **Quorum:** the point where enough independent evidence supports a decision.

The name is intentionally architectural, not tool-specific. Apiary is the environment for coordinated intelligence; it does not require bees, OpenClaw, a specific LLM, or any particular software stack.

## Bio-inspired design

Apiary borrows mechanisms from biological collective intelligence because they solve the same problems multi-agent AI workflows face: exploration cost, noisy signals, stale memory, local autonomy, negative feedback, and convergence.

The bio metaphor is not decoration. Each mechanism corresponds to an engineering behavior:

| Bio pattern | Natural function | Apiary workflow | Why it matters |
|---|---|---|---|
| Queen pheromone | Colony coherence | Coordinator owns synthesis | Prevents leaderless chaos |
| Foraging | Parallel exploration | Scouts investigate bounded questions | Gets breadth without one giant context |
| Waggle dance | Compressed report with quality signal | Structured scout output | Makes synthesis cheaper and more reliable |
| Stigmergy | Coordination through traces in the environment | Writeback to docs/runbooks/decisions | Lets future runs learn without hidden memory |
| Quorum sensing | Commit after enough convergent signal | Decision rules | Avoids both premature decisions and endless scouting |
| Stop signal | De-recruit from bad/depleted paths | Abort or down-rank risky proposals | Prevents sunk-cost continuation |
| Apoptosis | Clean self-termination | Scout stop conditions | Reduces loops, scope creep, and wasted tokens |
| Pheromone decay | Old trails fade | Memory/document review and pruning | Keeps stale decisions from dominating |
| Innate immunity | Fast generic threat detection | Plan-screen checklist | Catches obvious safety issues cheaply |
| Adaptive immunity | Slow specific learned defense | Devil's advocate scout | Catches subtle, context-specific risk |

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

## Workflow in practice

A typical Apiary run looks like this:

1. **Classify:** decide whether the task deserves a swarm or direct handling.
2. **Retrieve:** gather source evidence before asking scouts to speculate.
3. **Scout:** assign 1-3 bounded perspectives.
4. **Synthesize:** compare scout outputs; identify agreement, disagreement, evidence, and risk.
5. **Verify:** run the smallest meaningful proof: source check, test, dry run, review, or approval.
6. **Writeback:** save only durable learning to the chosen substrate.

The result is not "more agents for everything." The result is disciplined parallel thinking when parallel thinking helps.

## When to use Apiary

Use Apiary for:
- architecture decisions
- tool/framework adoption
- complex research synthesis
- risky automation plans
- design reviews
- security/privacy/stability tradeoffs
- situations where a devil's advocate would materially improve the decision

Do **not** use Apiary for:
- simple factual questions
- small edits
- routine lookups
- tasks where coordination overhead exceeds value

## The flow

```text
Classify -> Retrieve -> Scout -> Synthesize -> Verify -> Writeback
```

## Minimum requirements

Apiary requires only:

1. a coordinator,
2. one or more scouts/reviewers,
3. a structured scout report,
4. a durable place to save decisions,
5. a verification gate.

The coordinator can be a human, an AI assistant, a coding agent, or a team lead. Scouts can be subagents, separate LLM chats, humans, CI jobs, reviewers, or issue commenters.


## Documentation

- [Quickstart](QUICKSTART.md)
- [Architecture](ARCHITECTURE.md)
- [Technical Notes](TECHNICAL.md)
- [Protocol](protocol/apiary-protocol.md)
- [Decision Rules](protocol/decision-rules.md)
- [Safety Model](protocol/safety-model.md)
- [Contributing](CONTRIBUTING.md)

## Quick start

1. Read `protocol/apiary-protocol.md`.
2. Pick an adapter from `adapters/` or use `adapters/plain-markdown/`.
3. Copy `templates/scout-brief.md` and assign 1-3 scouts.
4. Ask scouts to return `templates/scout-output.yaml` shape.
5. Fill `checklists/synthesis-checklist.md`.
6. Verify before acting.
7. Save the decision using `checklists/writeback-checklist.md`.

## Core invariant

Scouts advise. The coordinator decides.

## License

MIT License. See [LICENSE](LICENSE).
