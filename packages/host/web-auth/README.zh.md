# @deepseek-ai/dsh-host-web-auth

[English](README.md) | 中文

Web 载体的会话登录闸门（函数插件，配置为 `{username, password, realm, sessionTtlSeconds}`）。当 `username` 与 `password` 均非空时，它会：

1. 在 `ctx.webServer` 注册一道前置闸门，只放行有效的 `dsh_session` Cookie 或匹配的 HTTP Basic 凭据。
2. 在 `/login` 提供浏览器登录页。
3. 在 `/auth/login` 与 `/auth/logout` 签发和注销会话。
4. 放行 `/manifest.webmanifest` 与 `/favicon.svg`，以便浏览器安装元数据无需会话即可加载。

未登录的文档导航会重定向到 `/login?next=…`。未登录的 API、静态资源与 WebSocket 返回 HTTP 401。用户名或密码为空时闸门保持开放，供回环部署使用。

随附 Web 组装从 `webStartup` 填充本行：`dsh web --auth-user` 与 `--auth-password` 提供账号，且仅在两者都存在时接受 `--host 0.0.0.0`。设置这对参数后还会打开 `/api` 的 Host 放行（`allowAnyHost`）。特权桌面与设置方法仍由 [`dsh-client-connection`](../../client/connection/README.zh.md) 钉在回环。

## Model Experience

无；本包是 Web 载体访问闸门，不触及模型请求。

#### KV Cache effect

无；本包既不组装也不发送提供方请求。

## Known Limitations and Deferred Work

- **这里不做 TLS 终结** — HTTPS 请用反向代理；当存在 `X-Forwarded-Proto: https` 时会话 Cookie 会加 `Secure`。
- **仅一组共享账号** — 整个进程只接受一对用户名与密码。
- **内存会话** — 进程重启后全部 Cookie 失效；没有多用户目录或找回密码流程。
