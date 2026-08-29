# AGENTS.md

DeepSeek Harness is an all-plugin Cordis agent harness. Repository code, package manifests, configuration, tests, and executed scripts are the current sources of truth. Do not require deleted Markdown documentation to be restored before development.

## Pre-release stance

Until the first tagged release, prefer correct foundations to compatibility shims: rename or repackage freely and update every live reference. Backends reject old on-disk formats. SQLite uses monotonic `SCHEMA_VERSION`; `dsh-session` keeps `SESSION_FORMAT_VERSION` at `0` with no compatibility promise.

Only `dsh` profiles launch supported Node applications. Package bins, demos, and public SDK argv escapes are unsupported.

## Repository layout

```text
vendor/      Vendored Cordis source
packages/    @deepseek-ai/dsh-* workspaces grouped by capability
python/      Python SDK and bundled runtime
native/      Native source and platform packages
.agents/     Agent workflows and reusable skills
docs/        Documentation metadata and assets
scripts/     Repository checks and generators
website/     Documentation website projection
```

Use more-specific `AGENTS.md` files when working in a subtree.

## Commands

```sh
pnpm install
pnpm run clean
pnpm run test
pnpm run test:coverage
pnpm run test:e2e
pnpm run test:expected
pnpm run test:snapshot
pnpm run test:snapshot:record
pnpm run typecheck
pnpm run lint
pnpm run duplication
pnpm run build
pnpm run hygiene
pnpm run check:windows-wine
pnpm run doc-sync
pnpm run test:docs
pnpm run website:build
pnpm dsh --profile headless "task"
pnpm run demo:ptc -- "task"
```

Run the smallest checks that cover the change. Before pushing or claiming checks pass, use [dsh-pre-push-checks](.agents/skills/dsh-pre-push-checks/SKILL.md). Report only commands actually run. Do not substitute `pnpm run test` for the `test:coverage` gate.

If a required command fails because the host sandbox blocks credentials, network, IPC, watching, or nested sandboxing, follow the active runtime approval policy. Never bypass a product sandbox or a real test failure.

## Secrets and configuration

Real-API tests and demos read `DEEPSEEK_API_KEY`, optional `DEEPSEEK_BASE_URL`, and root `.env`. Never commit credentials. `cordis.yml` accepts `!!js`, never `!js`, under plugin `config` and entry `disabled`; other metadata remains literal.

## Conventions

- Every npm package is named `@deepseek-ai/dsh-<name>`. Vendored packages are rescoped and private. Harness packages declare `@deepseek-ai/cordis` as a peer and development dependency.
- Use ESM everywhere. Use package names across packages and `.ts` extensions for local relative imports. Raw and Web `cordis.yml` bare plugins must appear in the resolver manifest's `dependencies`.
- Registrations are effects: every contribution uses `ctx.effect()` or `ctx.on()`, and registry `register()` methods return disposers.
- Runtime invariants assert owned event or mutable-data relationships, not service presence, plugin metadata, or fixed pure examples. An installer with no plausible relationship provides a package-specific empty explanation.
- Typed events use declaration merging and merge-extensible maps. Event JSDoc includes `@mode` and payload `@param`; scoped keys absent from payloads include `@dshScopeScan unsupported`.
- Closed discriminated unions end in `assertNever`; merge-extensible unions use a documented default branch.
- Waterfall listeners call `next()` to delegate. Returning without it short-circuits the chain.
- Anything included in a model request must be reconstructable from the session log. A new model-visible input requires a session event.
- Add behavior through plugin extension points. Change `agent-loop` only when the behavior cannot live in a plugin.
- A capability includes Service Definition, Service Provider, and Consumer roles. Split roles only when they evolve independently.
- Prefer maintained dependencies when they remove owned implementation and tests.
- Resolve defaults explicitly at the owning package boundary before execution; do not hide deployment choices inside `run()`.
- Deployment-varying plugin choices are validated `Config` fields. Protocol constants, external specifications, and security invariants remain fixed.
- Fail self-contained misconfiguration at load and other misconfiguration at the earliest resolvable point. Never silently skip a missing referent.
- Brand opaque cross-process, wire, storage, and package-boundary identifiers instead of using bare strings.
- Trust typed same-process values. Validate parser/config, queued, model/tool JSON, durable/file, worker, process, and wire inputs.
- Keep source and artifact programs separate. Static checks resolve workspace source; checks that consume built output declare and build that dependency.
- Packages with Host and Client programs expose face-specific leaf tsconfigs and a solution-only root.
- An empty `catch` names what it swallows and why; keep its `try` to one statement.
- Comments state non-obvious behavior, failure, timing, ownership, and safe-use facts. Do not restate code or preserve reasoning transcripts. Use [dsh-prose-standard](.agents/skills/dsh-prose-standard/SKILL.md) for prose decisions.
- Prefer symmetric treatment of parallel values; unexplained asymmetry usually indicates a missed extraction.
- Tests describe behavior. Update obsolete tests when behavior changes.
- Client UI copy belongs to typed locale dictionaries and reaches primitives through translated strings or localized props.
- Design each tool's host and Web presentation with its behavior. Host presenters stay pure; Web cards derive from raw events and persisted result metadata.
- Agent-loop, session lifecycle, and `SessionEventMap` changes update both TypeScript and Python SDK projections.
- Rewrite published Git history only with `--force-with-lease`; abort if the remote moved. Never use raw `--force`.
- Files end with exactly one trailing newline. Run `git diff --check` for changed text.

## Type safety

Compile under `strict: true` and `noImplicitAny`. Every remaining `any` explains why narrowing is infeasible. Public exports have concise JSDoc for non-obvious behavior; function-like exports document parameters and non-void returns.

Wire mechanically checkable invariants into an executed repository check and include an invalid case that proves rejection. Use narrow, justified exceptions instead of disabling a rule globally.

## Editing these instructions

Edit the real `AGENTS.md` file rather than a `CLAUDE.md` symlink. Keep each rule self-contained and remove requirements whose owning files or mechanisms no longer exist.

## Vendoring

Treat `vendor/` as pinned third-party source. Avoid unrelated edits there. When intentionally updating vendored code, preserve its manifest metadata and run the relevant tests and build.
