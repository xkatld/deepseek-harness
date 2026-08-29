# AGENTS.md — Documentation Metadata and Assets

The `docs/` tree currently contains translation-pair metadata and documentation assets rather than authored Markdown pages. Do not infer that a missing `.md` or `.zh.md` file must be restored, and do not block package development on deleted architecture, subsystem, cookbook, testing, or README pages.

## Scope

- Treat `*.i18n.yaml` files as metadata for removed or externally owned document pairs unless a live generator or check proves otherwise.
- Preserve image and binary assets that still have consumers. Before deleting or renaming one, search code, configuration, website manifests, scripts, and metadata for references.
- Do not create replacement Markdown merely to satisfy stale links, manifests, budgets, pairing records, or documentation checks. Update or retire the stale owner instead when that work is requested.
- Use repository code, manifests, configuration, tests, generated schemas, and executed behavior as current evidence. Metadata alone does not establish a runtime requirement.

## Editing

- Keep YAML valid and preserve fields whose consumers still read them.
- Trace a generated or projected artifact to its source before editing. Change the source and regenerate the artifact when the generator remains active.
- Keep prose concise, current-state, and direct. Preserve behavior, failure, timing, ownership, modality, exceptions, and consequences; remove reasoning transcripts and descriptions of deleted documentation workflows.
- Do not add bilingual Markdown counterparts unless the user explicitly requests new documentation and the repository has a live publication path for it.
- Run only checks relevant to the changed metadata, assets, generators, or consumers. A check that assumes intentionally deleted Markdown is stale and should not force restoration.

## Instruction maintenance

References in `AGENTS.md` files must point to existing files. When a documented mechanism is removed, delete or rewrite its instruction in the same change instead of adding a warning that agents must search for the missing document.
