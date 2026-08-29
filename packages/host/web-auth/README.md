# @deepseek-ai/dsh-host-web-auth

English | [中文](README.zh.md)

Session login gate for the Web carrier (function plugin, config `{username, password, realm, sessionTtlSeconds}`). When both `username` and `password` are non-empty it:

1. Registers one pre-route gate on `ctx.webServer` that admits only a valid `dsh_session` cookie or matching HTTP Basic credentials.
2. Serves a browser login page at `/login`.
3. Mints and revokes sessions at `/auth/login` and `/auth/logout`.
4. Leaves `/manifest.webmanifest` and `/favicon.svg` reachable without a session so browser install metadata can load.

Unauthenticated document navigations redirect to `/login?next=…`. Unauthenticated API, asset, and WebSocket traffic receives HTTP 401. Empty username or password leaves the gate open for loopback deployments.

The shipped Web composition feeds this row from `webStartup`: `dsh web --auth-user` and `--auth-password` populate the account, and `--host 0.0.0.0` is accepted only when both are present. With those flags set, the composition also opens the `/api` Host allowlist (`allowAnyHost`). Privileged desktop and settings methods stay loopback-pinned in [`dsh-client-connection`](../../client/connection/README.md).

## Model Experience

None, as the package is a Web carrier access gate; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No TLS termination here** — set a reverse proxy for HTTPS; the session cookie adds `Secure` when `X-Forwarded-Proto: https` is present.
- **One shared account** — the gate accepts exactly one username and password for the whole process.
- **In-memory sessions** — restarting the process invalidates every cookie; there is no multi-user directory or password reset flow.
