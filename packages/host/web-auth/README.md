---
description: "Session login and HTTP Basic access gate for public Web profile deployments."
kind: "package-reference"
---

# @deepseek-ai/dsh-host-web-auth

English | [中文](README.zh.md)

## Summary

This package protects the Web carrier with one shared account. It serves the login page, mints `dsh_session` cookies, accepts matching HTTP Basic credentials, and denies unauthenticated HTTP and WebSocket requests before route dispatch.

## Table of Contents

- Use this package
- Understand the implementation
- Model Experience
- Known Limitations and Deferred Work
- Dev Note

-----

## Use this package

Mount the function plugin with `webserver` and configure `{ username, password, realm, sessionTtlSeconds }`. Empty credentials leave the gate open for loopback deployments. The shipped Web profile maps `--auth-user` and `--auth-password` to this configuration and requires both flags for `--host 0.0.0.0`.

## Understand the implementation

The plugin registers one pre-dispatch `WebAccessGate`. It serves `/login`, `/auth/login`, and `/auth/logout`; keeps `/manifest.webmanifest` and `/favicon.svg` public; accepts valid session cookies or Basic credentials; redirects unauthenticated document navigation to login; and returns HTTP 401 for unauthenticated API, asset, and WebSocket traffic.

## Model Experience

None, as the package is a Web carrier access gate; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No TLS termination here** — use a reverse proxy for HTTPS; the session cookie adds `Secure` when `X-Forwarded-Proto: https` is present.
- **One shared account** — the gate accepts exactly one username and password for the whole process.
- **In-memory sessions** — restarting the process invalidates every cookie; there is no multi-user directory or password reset flow.

### Dev Note

None.
