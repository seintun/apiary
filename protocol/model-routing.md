# Model Routing

Apiary is provider- and model-agnostic. The protocol chooses **work roles**, not concrete model names.

Public/default Apiary MUST work with zero model configuration. When no local model policy is present, adapters should omit the `model` field and let the host runtime choose its normal default and fallbacks.

## Roles

| Role | Purpose | Default behavior |
|---|---|---|
| `cheapWorker` | Low-cost extraction, file inspection, summarization, mechanical evidence gathering | Host default |
| `balancedWorker` | Bounded research, comparison, moderate analysis | Host default |
| `strongJudge` | Final synthesis, architecture judgment, tradeoff decisions | Host default |
| `reviewer` | Devil's advocate, security/risk review, migration risk | Host default |
| `fallbackSafe` | Last-resort recovery when a preferred model is unavailable | Host default |

## Policy rules

1. **Zero config works.** If no local policy exists, do not pass an explicit model.
2. **Roles are portable.** Docs and public templates should say `cheapWorker`, not a provider-specific model.
3. **Preferences are soft by default.** A configured model is a preference unless `required: true` is set.
4. **Retry once on soft preference failure.** If a preferred model fails, retry the same worker once with no explicit model.
5. **Required means required.** Only use `required: true` when the user explicitly asks for a specific model/provider/local-only run.
6. **Avoid loops.** Do not keep cycling through model names inside Apiary; delegate broad fallback handling to the host runtime.
7. **Make choices inspectable.** When useful, summarize the roles used and whether explicit models were applied.
8. **Air-gap safe by default.** Apiary must remain usable when GPT/OpenAI/cloud providers are unavailable. If a local runtime is the host default, omitting `model` should use that local runtime.
9. **Never require network by policy.** Public Apiary docs and templates must not require cloud model names, provider APIs, telemetry, or model discovery calls.

## Resolution order

For a role such as `cheapWorker`, adapters should resolve in this order:

1. Local Apiary config for that role, if present.
2. Adapter/runtime-specific worker defaults, if present.
3. Host/session default by omitting the model.

If resolution returns `auto`, `default`, `host-default`, `null`, or no value, omit the model.

## Example local policy

```yaml
apiary:
  models:
    cheapWorker:
      prefer: auto
      required: false
      fallbackToDefault: true

    strongJudge:
      prefer: default
      required: false
      fallbackToDefault: true

    reviewer:
      prefer: my-strong-review-model
      required: false
      fallbackToDefault: true
```

This file is a protocol recommendation. Concrete adapters may implement it with scripts, config files, CLI flags, or manual instructions.

## Air-gapped / local-only operation

For air-gapped machines, local LLMs, or environments with no GPT/OpenAI access:

1. Leave Apiary role preferences unset, `auto`, or `default`.
2. Configure the host runtime/OpenClaw default to the local model/provider.
3. Apiary adapters should omit `model`, allowing the host runtime to use the local default.
4. If a role has a soft cloud preference and it fails, retry once with no explicit model.
5. If the user says "local only" or "air-gapped only", set `required: true` only for a known local model/provider, or leave `model` omitted and rely on a local-only host runtime.

Do not perform remote provider discovery as part of default routing. Optional setup tools may inspect local config, but should not make network calls unless the user asks.

## Failure handling contract

Adapters that can catch spawn failures should implement this sequence:

```text
resolve(role)
if resolved model is empty:
  spawn without model
else:
  try spawn with preferred model
  if spawn fails and required is false and fallbackToDefault is true:
    retry once without model
  else:
    surface the failure clearly
```

This contract handles provider outage, quota exhaustion, renamed models, and absent cloud credentials while preserving explicit user constraints.
