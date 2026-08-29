---
description: "Read-only Git repository status and commit inspection over the generated Remote API."
kind: "package-reference"
---

# @deepseek-ai/dsh-api-git

English | [中文](README.zh.md)

## Summary

This package exposes repository status, commit history, changed files, and commit diffs to authenticated Remote clients.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

## Use this package

Mount the service in a Host profile and mount its generated Remote contribution in the Client assembly. The optional `cwd` configuration selects the default repository.

## Understand the implementation

The service runs bounded `git -C` subprocesses through `execFile`. The generated `git` Remote namespace contains `status`, `history`, `commitFiles`, and `diff`.

## Model Experience

This package adds no model-visible content and writes no Session events.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

The API is read-only and requires Git on the Host executable path.

### Dev Note

None.
