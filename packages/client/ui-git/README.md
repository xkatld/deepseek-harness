---
description: "Git status, history, changed files, and commit diffs for the Web GUI details panel."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-git

English | [中文](README.zh.md)

## Summary

This package adds a Git tab to the Web GUI details column. It shows the current branch, working-tree state, synchronization counts, commit history, changed files, and commit diff for the active Session workspace.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

## Use this package

Mount this client plugin with `ui-chat`, `api-remotes`, and `api-git`. Open the details column and select the Git tab. Selecting a commit switches to its file list and diff; Back to list restores repository history.

## Understand the implementation

The plugin occupies `conversation.details.git`. Its injected callbacks call the generated `ctx.remote.git` namespace. Repository data stays component-local and refreshes when the active workspace changes or the user presses Refresh.

## Model Experience

This package adds no model-visible content and writes no Session events.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

The panel is read-only and requires the active workspace to be a Git repository.

### Dev Note

None.
