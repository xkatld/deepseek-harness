# Agent Note: Git Remote and details panel

Status: implemented

English | [中文](2026-09-01-git-remote-details-panel.zh.md)

## Problem

The Web client needs repository status and commit inspection without restoring the removed `host/apiproxy` architecture or replacing the official Tool details renderer.

## Decision

The `api-git` package owns an independent Typert Remote namespace. The Web profile mounts its Host service, the Client Remote assembly mounts its generated contribution, and `ui-git` occupies the `conversation.details.git` slot declared by `ui-chat`.

The details column retains Tool details and switches between Tool and Git tabs. Git view state and repository results remain component-local because they are presentation state rather than Session data.

The Remote exposes repository status, branch and upstream counts, working-tree changes, bounded commit history, commit file lists, and commit diffs. Operations are read-only and use `execFile('git', ['-C', ...])`; request values never enter a shell command.

## Alternatives considered

**Restore `host/apiproxy`.** The official Host API is organized around Typert Remote services, so restoring the removed proxy would duplicate transport ownership and bypass generated Client typing.

**Replace the complete details slot.** This would remove official Tool details. A child Git slot preserves both features and keeps composition explicit.

## Consequences

The Web profile gains one Host service, one generated Client Remote contribution, and one dynamic UI plugin. Repository inspection requires Git on the Host executable path. The real-repository Host test verifies status, history, changed files, and commit diff; Client compilation and bundling verify the Remote and slot wiring.
