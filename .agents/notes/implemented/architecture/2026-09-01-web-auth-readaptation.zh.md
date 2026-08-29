# Agent Note: 公网 Web 鉴权门禁

Status: implemented

[English](2026-09-01-web-auth-readaptation.md) | 中文

## Problem

将 Web profile 绑定到所有网络接口会暴露 Remote API 和 WebSocket upgrade。官方 WebServer 需要一个鉴权扩展，同时保留其路由、fallback、静态资源、压缩和 upgrade 所有权。

## Decision

`dsh-host-web-auth` 向 WebServer 注册 `WebAccessGate`。门禁放行公开登录资源，验证登录会话或 HTTP Basic 凭据，并在 HTTP 或 upgrade 分发前写入拒绝响应。

Web 启动参数解析要求 `--auth-user` 和 `--auth-password` 成对出现。绑定 `0.0.0.0` 时必须提供两者。回环部署可以省略它们并保持门禁开放。

WebServer 只拥有门禁顺序和分发时机。每个门禁拥有自己的 HTTP 与 upgrade 拒绝行为，因此鉴权可以返回 401，而无需修改 fallback 或协议路由。

## Alternatives considered

**在每个路由中加入鉴权。** 这会让 upgrade 和 fallback 路径不受保护，并在各路由所有者之间重复策略。

**替换 WebServer 分发。** 这可能丢失官方压缩、index 注入、静态 fallback 和 upgrade 行为。前置分发注册保持这些所有者不变。

## Consequences

公网部署获得登录会话、Basic 兼容，以及对未鉴权 HTTP 和 upgrade 请求的一致拒绝。凭据仍是调用配置，不会持久化。Web auth 包测试固定 Cookie、登录、公开资源、Basic 和拒绝行为。
