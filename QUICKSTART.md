# Apiary Quickstart

## 5-minute manual run

1. **Classify**

   Is this task complex enough for Apiary? If not, answer directly.

2. **Pick workers**

   For most non-trivial tasks, use two workers:
   - research/adaptation,
   - devil's advocate.

3. **Create worker briefs**

   Copy `templates/worker-brief.md` once per worker and fill in:
   - role,
   - objective,
   - minimal context,
   - forbidden actions.

4. **Collect worker outputs**

   Ask each worker to return `templates/worker-output.yaml` format.

5. **Synthesize**

   Fill `templates/synthesis-report.md` using `checklists/synthesis-checklist.md`.

6. **Verify**

   Use source inspection, tests, dry run, peer review, or explicit human approval.

7. **Write back**

   Save only durable conclusions using `checklists/writeback-checklist.md`.

## Example worker set

```text
Worker A: Research what Tool X does, evidence, and comparable alternatives.
Worker B: Find risks, overlap, instability, privacy concerns, and reasons not to adopt.
Worker C: Map useful ideas into our current workflow without adopting Tool X directly.
```

## Rule of thumb

If Apiary feels heavier than the task, stop using Apiary and answer directly.
