# Apiary Architecture

Apiary is a portable hivemind protocol for coordinated AI/human decision-making.

It is intentionally **not** an orchestration runtime. The architecture is a set of roles, artifacts, and decision rules that can be mapped onto many tools.

## Core flow

```text
Classify -> Retrieve -> Scout -> Synthesize -> Verify -> Writeback
```

## Roles

### Coordinator

The coordinator owns the final decision.

Responsibilities:
- decide whether Apiary is justified,
- scope scouts,
- minimize private context,
- compare outputs,
- resolve conflicts,
- verify conclusions,
- write back durable learning.

The coordinator can be:
- an AI assistant,
- a human lead,
- a coding agent,
- a team facilitator,
- a lightweight script/workflow.

### Scouts

Scouts are bounded independent perspectives.

Common scout roles:
- **Research scout:** facts, sources, prior art.
- **Devil's advocate scout:** risks, instability, privacy/security, overkill.
- **Adaptation scout:** how to implement in the current environment.
- **Reviewer scout:** plan/diff/output review.

Scouts advise. The coordinator decides.

## Artifacts

| Artifact | Purpose |
|---|---|
| `templates/scout-brief.md` | Scope a scout before work starts |
| `templates/scout-output.yaml` | Structured scout report |
| `templates/synthesis-report.md` | Coordinator's final synthesis |
| `checklists/synthesis-checklist.md` | Prevent shallow synthesis |
| `checklists/plan-screen-checklist.md` | Catch obvious safety issues |
| `checklists/writeback-checklist.md` | Decide what becomes durable |
| `protocol/decision-rules.md` | Quorum and stop-signal rules |
| `protocol/safety-model.md` | Approval/privacy boundaries |

## Capability tiers

### Tier 0: Manual

Use markdown templates with humans or separate LLM chats.

### Tier 1: Chat assistant

A single assistant coordinates scouts manually across chats or prompts.

### Tier 2: Agent runtime

An agent system can spawn subagents and manage files/tools.

### Tier 3: Team workflow

Use GitHub Issues, PRs, Slack/Discord, Notion/Confluence, or docs workflows.

## Design constraints

- No required runtime.
- No required LLM provider.
- No required vector database.
- No required notes app.
- No background daemon.
- No marketplace dependency.
- No automatic external actions.

## Safety boundary

Apiary never replaces the host system's safety rules. Destructive, external, credential-related, or permission-expanding actions require explicit approval in whatever environment is running Apiary.
