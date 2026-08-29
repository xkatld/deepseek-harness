# Agent Note: Public Web authentication gate

Status: implemented

English | [中文](2026-09-01-web-auth-readaptation.zh.md)

## Problem

Binding the Web profile to all interfaces exposes Remote APIs and WebSocket upgrades. The official WebServer needs an authentication extension that preserves its route, fallback, static, compression, and upgrade ownership.

## Decision

`dsh-host-web-auth` registers a `WebAccessGate` with WebServer. The gate admits public login assets, validates login sessions or HTTP Basic credentials, and writes the denial response before HTTP or upgrade dispatch.

The Web startup parser requires `--auth-user` and `--auth-password` as a pair. A `0.0.0.0` bind requires both values. Loopback deployments may omit them and leave the gate open.

WebServer owns only gate ordering and dispatch timing. Each gate owns its HTTP and upgrade rejection behavior, so authentication can return 401 without changing fallback or protocol routes.

## Alternatives considered

**Put authentication in every route.** This leaves upgrade and fallback paths unprotected and duplicates policy across route owners.

**Replace WebServer dispatch.** This risks dropping official compression, index injection, static fallback, and upgrade behavior. A pre-dispatch registration keeps those owners unchanged.

## Consequences

Public deployments gain login sessions, Basic compatibility, and consistent denial of unauthenticated HTTP and upgrade requests. Credentials remain invocation configuration and are not persisted. The Web auth package tests pin cookie, login, public-asset, Basic, and rejection behavior.
