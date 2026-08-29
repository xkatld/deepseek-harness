# Agent Note: Rehome the Git panel as an official client package

Status: implemented

English | [中文](2026-08-26-ui-git-official-arch-rehome.zh.md)

## Problem

The Git panel is a right-sidebar conversation detail view that needs the current client shell, slot, and Remote architecture, but the old feature package wiring still points at the removed API Proxy style and a pre-restructure conversation details seat.

## Decision

`@deepseek-ai/dsh-client-ui-git` stays the Git UI owner and mounts into the current client package layout without shell-specific forks.

The package exposes only the current client entry points and keeps its package metadata aligned with the official client package organization.

## Consequences

The Git panel remains a separate client package that can be mounted through the current conversation and layout slot system.

The package no longer relies on the removed API Proxy package organization.

## Verification

The package manifest, tsconfig, tsdown config, and invariant entry now exist under the official client package layout.
