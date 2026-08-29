# AGENTS.md — Harness Packages

These rules supplement the repository-wide [conventions](../AGENTS.md#conventions). Inspect the affected package source, manifest, configuration, tests, and neighboring implementations before editing. Deleted package READMEs, architecture pages, Agent Notes, and postmortems are not prerequisites or current authorities.

## Package behavior

- Service packages default-export their service class. Function plugins named-export `name`, `inject`, `Config`, and `apply` and have no default export.
- Optional services use `ctx.get(name)`. Reserve `ctx.<name>` for declared injections.
- Product-visible plugins require a non-unit real-composition test. Boot test-only `cordis.yml` through the Loader and application or process; mock only external services or nondeterministic inputs and assert model-visible, durable, or user-visible output.
- Under `ctx.agents.withInitiator()`, recover the Agent at each orchestration entry, derive `agent.session`, and capture it in operation-local helpers. Keep `Agent` and `Session` explicit at lifecycle, log, service, authority, worker/process, persistence, and wire interfaces.
- Represent one asynchronous operation with one lifecycle controller or transaction. Independent readiness, cancellation, disposal, reservation, or sentinel state requires an independent owner or settlement point.
- Design Service Definitions for all current Consumers. Keep tool schema, Loader, UI, transport, and provider-specific behavior in Consumers or providers. A public service method with one internal caller is usually a private capability closure.
- Tie every abstraction, state machine, option, defensive copy, and compatibility path to a current contract or production consumer.
- Require evidence for defaults, public operations, formats, and imported concepts. Otherwise require an explicit value or defer the choice.
- Write prompts, tool schemas, results, and diagnostics from the model's perspective. Exclude UI, transport, and implementation vocabulary. Pin stable model-visible text and cover dynamic behavior through snapshots or end-to-end tests.
- Enforce a decision in the executor that makes it. Schema omission, prompt filtering, wrappers, and listener order are not enforcement when alternate callers can bypass them.
- Publish state and notifications only after the operation commits. Derive caches, prompts, UI echoes, replay, and query views from one authoritative source.
- Apply byte, token, item, and time limits where the complete emitted or retained value, including wrappers and metadata, is known. Test tiny and exact limits, oversized single chunks, and multibyte byte limits.
- Registry contributions prove disposal by disposing their fiber and observing removal.
- Every package owns `./invariant`, registers its manifest name, and checks an event/data relationship. Packages with no runtime relationship provide a package-specific `No runtime invariant:` explanation.

## Package structure

- Package tsconfigs extend the relevant root base config, set `rootDir` to `src` and `outDir` to `lib/types`, reference workspace dependencies and runtime invariants, and appear in the owning aggregate. Distinct Host and Client programs use leaf configs plus a solution-only root.
- `src/types.ts` contains types only.
- Tests live under package-level `tests/`, not `src/__tests__/`.
- Keep JSDoc synchronized with behavior. Do not require deleted package READMEs or subsystem pages to be restored; if a package still owns live non-Markdown documentation or generated metadata, update that owner.
- Run focused tests and repository checks that exercise the changed package behavior.
