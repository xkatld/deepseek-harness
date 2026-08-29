---
description: "Read-only Git repository status and commit inspection over the generated Remote API."
kind: "package-reference"
---

# @deepseek-ai/dsh-api-git

English | [中文](README.zh.md)

## Summary

This package exposes repository status, commit history, changed files, and commit diffs to authenticated Remote clients.

## Table of Contents

- Use this package
- Understand the implementation
- Model Experience
- Known Limitations and Deferred Work

-----

## Use this package

Mount the service in a Host profile and mount its generated Remote contribution in the Client assembly. The optional `cwd` configuration selects the default repository.

## Understand the implementation

The service runs bounded `git -C` subprocesses through `execFile`. The generated `git` Remote namespace contains `status`, `history`, `commitFiles`, and `diff`.

## Model Experience

None, as the package exposes read-only repository inspection and registers no model-facing input.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

- **Read-only operations** — the API does not stage, commit, or modify repository state.
- **Host Git required** — Git must be available on the Host executable path.

### Dev Note

None.
