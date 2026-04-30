# Contributing to Apiary

Apiary is protocol-first. Contributions should improve portability, clarity, safety, or real-world usefulness without turning Apiary into a heavyweight runtime.

## Good contributions

- clearer examples,
- new platform adapters,
- pressure scenarios,
- safety checklist improvements,
- wording that makes the protocol easier to follow,
- translations,
- optional validation scripts that do not become required.

## Contributions to be careful with

- new required steps,
- new metaphors,
- runtime integrations,
- LLM provider integrations,
- background automation,
- persistent memory systems,
- anything that makes Apiary less tool-agnostic.

## Rule for new mechanisms

A new mechanism should include:

1. the failure mode it solves,
2. a pressure scenario,
3. why existing protocol pieces are insufficient,
4. how to roll it back,
5. proof it does not encourage over-swarming.

## Development workflow

1. Open an issue or write a short proposal.
2. Add or update examples/tests first.
3. Update protocol/templates/adapters.
4. Verify a non-specialist can follow the docs.
