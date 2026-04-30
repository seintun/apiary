# Apiary Diagrams

This page shows how Apiary works using Mermaid diagrams. GitHub renders these diagrams automatically.

## Core workflow

```mermaid
flowchart LR
    A[Classify] --> B[Retrieve]
    B --> C[Scout]
    C --> D[Synthesize]
    D --> E[Verify]
    E --> F[Writeback]

    A -. skip if simple .-> G[Direct answer / direct action]
```

Apiary starts by deciding whether a task deserves multi-perspective work. Simple tasks stay direct. Complex or risky tasks move through retrieval, workers, synthesis, verification, and durable writeback.

## Roles and artifacts

```mermaid
flowchart TB
    U[User / Team / Request] --> COORD[Coordinator]

    COORD --> R[Research Worker]
    COORD --> D[Devil's Advocate Worker]
    COORD --> A[Adaptation Worker]
    COORD --> V[Reviewer Worker]

    R --> SR[Structured Worker Reports]
    D --> SR
    A --> SR
    V --> SR

    SR --> SYN[Synthesis Report]
    SYN --> CHECK[Verification Gate]
    CHECK --> WB[Writeback]

    WB --> DOCS[Docs / Wiki / Repo]
    WB --> ADR[Decision Record]
    WB --> RUNBOOK[Runbook / Playbook]
    WB --> ISSUE[Issue / PR Comment]
```

The coordinator owns the final decision. Workers provide bounded perspectives. Durable writeback keeps useful learning from disappearing into chat history.

## Decision routing

```mermaid
flowchart TD
    START[New task] --> SIMPLE{Simple and low risk?}
    SIMPLE -- yes --> DIRECT[Answer or act directly]
    SIMPLE -- no --> RISK{Meaningful risk or tradeoffs?}

    RISK -- no --> ONE[Use one focused lookup/review]
    RISK -- yes --> SCOPE[Define objective, constraints, forbidden actions]

    SCOPE --> COUNT{How broad/high-stakes?}
    COUNT -- moderate --> TWO[Run 2 workers: research/adaptation + devil's advocate]
    COUNT -- broad/high-stakes --> THREE[Run 3 workers: research + devil's advocate + adaptation]

    TWO --> SYN[Synthesize]
    THREE --> SYN
    ONE --> SYN

    SYN --> AGREE{Enough evidence / agreement?}
    AGREE -- yes --> VERIFY[Verify]
    AGREE -- no, factual conflict --> TARGET[Run one targeted resolving scout]
    AGREE -- no, unresolved risk --> ASK[Ask human / pause]

    TARGET --> SYN
    VERIFY --> WRITE[Write back if durable]
```

Apiary is not “always swarm.” It defaults to direct work unless independent perspectives add value.

## Worker lifecycle

```mermaid
stateDiagram-v2
    [*] --> Briefed
    Briefed --> Foraging: scoped objective
    Foraging --> Reporting: enough evidence
    Foraging --> Apoptosis: no progress / out of scope / unsafe / too costly
    Reporting --> Synthesis
    Apoptosis --> Synthesis: low-quality abandon report
    Synthesis --> [*]
```

Workers should stop cleanly when they are stuck, unsafe, or outside scope. This avoids runaway exploration.

## Quorum and stop signals

```mermaid
flowchart TD
    REPORTS[Worker reports] --> VETO{Critical risk with evidence?}
    VETO -- yes --> STOP[Stop signal: pause, resolve, or abandon]
    VETO -- no --> QUORUM{2 of 3 agree with medium+ confidence?}
    QUORUM -- yes --> COMMIT[Commit with caveats]
    QUORUM -- no --> DISAGREE{Substantive factual disagreement?}
    DISAGREE -- yes --> TARGET[Run one targeted resolving scout]
    DISAGREE -- no --> ASK[Escalate / ask human]
```

A concrete devil's-advocate or reviewer risk can outweigh multiple optimistic workers until resolved.

## Platform independence

```mermaid
flowchart LR
    APIARY[Apiary Protocol] --> MD[Plain Markdown]
    APIARY --> CHAT[Separate LLM Chats]
    APIARY --> AGENT[Agent Runtimes]
    APIARY --> HUMAN[Human Teams]
    APIARY --> GH[GitHub Issues / PRs]
    APIARY --> DOCS[Notion / Confluence / Docs]

    AGENT --> OC[OpenClaw]
    AGENT --> CC[Claude Code]
    AGENT --> CX[Codex / Cursor / Gemini]
```

The protocol is the stable center. Adapters map Apiary to specific tools.
