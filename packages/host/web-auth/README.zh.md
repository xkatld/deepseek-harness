---
description: "用于公网 Web profile 部署的会话登录与 HTTP Basic 访问门禁。"
kind: "package-reference"
---

# @deepseek-ai/dsh-host-web-auth

[English](README.md) | 中文

## 概述

本包使用一组共享账号保护 Web 载体。它提供登录页、签发 `dsh_session` Cookie、接受匹配的 HTTP Basic 凭据，并在路由分发前拒绝未鉴权的 HTTP 和 WebSocket 请求。

## 目录

- 使用本包
- 了解实现
- 模型体验
- 已知限制和延期工作
- 开发备注

-----

## 使用本包

将函数插件与 `webserver` 一起挂载，并配置 `{ username, password, realm, sessionTtlSeconds }`。凭据为空时门禁保持开放，供回环部署使用。随附 Web profile 将 `--auth-user` 和 `--auth-password` 映射到该配置，并要求 `--host 0.0.0.0` 同时提供两个参数。

## 了解实现

插件注册一个前置分发 `WebAccessGate`。它提供 `/login`、`/auth/login` 和 `/auth/logout`；保持 `/manifest.webmanifest` 与 `/favicon.svg` 公开；接受有效会话 Cookie 或 Basic 凭据；将未鉴权的文档导航重定向到登录页；并对未鉴权的 API、静态资源和 WebSocket 流量返回 HTTP 401。

## 模型体验

无；本包是 Web 载体访问门禁，不触及模型请求。

#### KV Cache effect

无；本包既不组装也不发送提供方请求。

## 已知限制和延期工作

- **这里不做 TLS 终结** — HTTPS 请使用反向代理；存在 `X-Forwarded-Proto: https` 时，会话 Cookie 会添加 `Secure`。
- **仅一组共享账号** — 整个进程只接受一对用户名与密码。
- **内存会话** — 进程重启后全部 Cookie 失效；没有多用户目录或找回密码流程。

### 开发备注

无。
