/**
 * @deepseek-ai/dsh-host-web-auth — session login gate for the Web carrier.
 * When username and password are both non-empty, every HTTP request and every
 * upgrade must present a valid session cookie (or matching Basic credentials)
 * before any named route, fallback, or upgrade handler runs. The package also
 * owns the login page and session mint/revoke routes. Empty credentials leave
 * the gate open so loopback deployments keep the unauthenticated posture.
 * @module @deepseek-ai/dsh-host-web-auth
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Duplex } from 'node:stream'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { WebAccessGate } from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Stable Cordis plugin name. */
export const name = 'host-web-auth'

/** Services required before the gate can register. */
export const inject = ['webServer']

/** Session cookie written after a successful password login. */
export const SESSION_COOKIE = 'dsh_session'

/** Login page path served without a session. */
export const LOGIN_PATH = '/login'

/** Password login endpoint. */
export const LOGIN_API_PATH = '/auth/login'

/** Session revoke endpoint. */
export const LOGOUT_API_PATH = '/auth/logout'

/** Browser-install metadata that must load without credentials. */
export const PUBLIC_ASSET_PATHS = [
  '/manifest.webmanifest',
  '/favicon.svg',
] as const

/** Plugin config: one shared account and the login/session posture. */
export interface Config {
  /** Username accepted by the gate; empty disables authentication. */
  username: string
  /** Password accepted by the gate; empty disables authentication. */
  password: string
  /** Realm string returned with HTTP 401 challenges. */
  realm: string
  /** Session lifetime in seconds after mint or successful reuse. */
  sessionTtlSeconds: number
}

export const Config: z<Config> = z.object({
  username: z.string().default(''),
  password: z.string().default(''),
  realm: z.string().default('DeepSeek Harness'),
  sessionTtlSeconds: z.natural().min(60).default(60 * 60 * 24 * 7),
})

interface SessionRecord {
  expiresAt: number
}

/**
 * Compare two UTF-8 strings in constant time when their byte lengths match.
 * @param left - expected credential fragment.
 * @param right - presented credential fragment.
 * @returns true only when both strings are byte-identical.
 */
function safeEqualText(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'utf8')
  const rightBytes = Buffer.from(right, 'utf8')
  if (leftBytes.byteLength !== rightBytes.byteLength) return false
  return timingSafeEqual(leftBytes, rightBytes)
}

/**
 * Decode one Authorization header into a Basic username and password.
 * @param header - raw Authorization header value, or undefined when absent.
 * @returns the pair, or undefined when the header is missing or malformed.
 */
export function parseBasicAuthorization(header: string | undefined): { username: string; password: string } | undefined {
  if (header === undefined) return undefined
  const match = /^Basic\s+(\S+)$/i.exec(header.trim())
  if (match === null) return undefined
  let decoded: string
  try {
    decoded = Buffer.from(match[1] ?? '', 'base64').toString('utf8')
  } catch {
    return undefined
  }
  const separator = decoded.indexOf(':')
  if (separator < 0) return undefined
  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  }
}

/**
 * Read one cookie value from a Cookie header.
 * @param header - raw Cookie header, or undefined when absent.
 * @param name - cookie name.
 * @returns the decoded value, or undefined when missing.
 */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined || header === '') return undefined
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf('=')
    if (separator <= 0) continue
    if (trimmed.slice(0, separator) !== name) continue
    try {
      return decodeURIComponent(trimmed.slice(separator + 1))
    } catch {
      return trimmed.slice(separator + 1)
    }
  }
  return undefined
}

/**
 * Resolve the request pathname, or undefined when the URL cannot be parsed.
 * @param req - incoming HTTP request.
 */
function requestPathname(req: IncomingMessage): string | undefined {
  try {
    return new URL(req.url ?? '/', 'http://dsh.internal').pathname
  } catch {
    return undefined
  }
}

/** Whether a root request carries one official browser launch token. */
function isBrowserTokenExchange(req: IncomingMessage, pathname: string, method: string): boolean {
  if (pathname !== '/' || method.toUpperCase() !== 'GET') return false
  try {
    return new URL(req.url ?? '/', 'http://dsh.internal').searchParams.getAll('token').length === 1
  } catch {
    return false
  }
}

/**
 * Whether this path is reachable without a session while auth is enabled.
 * @param pathname - absolute request pathname.
 * @param method - HTTP method.
 * @returns whether the request may bypass authentication.
 */
export function isPublicAuthPath(pathname: string, method: string): boolean {
  const upper = method.toUpperCase()
  if (pathname === LOGIN_PATH && (upper === 'GET' || upper === 'HEAD')) return true
  if (pathname === LOGIN_API_PATH && upper === 'POST') return true
  if (pathname === LOGOUT_API_PATH && (upper === 'GET' || upper === 'POST')) return true
  if ((upper === 'GET' || upper === 'HEAD') && (PUBLIC_ASSET_PATHS as readonly string[]).includes(pathname)) {
    return true
  }
  return false
}

/**
 * Whether the client is navigating for an HTML document.
 * @param req - incoming HTTP request.
 */
function wantsHtmlLoginRedirect(req: IncomingMessage): boolean {
  const method = (req.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return false
  const dest = typeof req.headers['sec-fetch-dest'] === 'string' ? req.headers['sec-fetch-dest'] : ''
  if (dest === 'document') return true
  const accept = typeof req.headers.accept === 'string' ? req.headers.accept : ''
  return accept.includes('text/html')
}

/**
 * Build a safe relative next path for post-login redirect.
 * @param raw - user-supplied next value.
 * @returns a same-origin relative redirect path.
 */
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (raw === undefined || raw === null || raw === '') return '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  if (raw.startsWith(LOGIN_PATH)) return '/'
  return raw
}

/**
 * Read a request body capped at maxBytes.
 * @param req - incoming request.
 * @param maxBytes - hard upper bound.
 */
async function readBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    total += buffer.byteLength
    if (total > maxBytes) throw new Error('body too large')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}

/**
 * Parse login credentials from JSON or form bodies.
 * @param contentType - request content type.
 * @param body - raw body bytes.
 * @returns normalized login fields.
 */
export function parseLoginBody(contentType: string | undefined, body: Buffer): { username: string; password: string; next: string } {
  const text = body.toString('utf8')
  const type = contentType ?? ''
  if (type.includes('application/json')) {
    const parsed = JSON.parse(text) as { username?: unknown; password?: unknown; next?: unknown }
    return {
      username: typeof parsed.username === 'string' ? parsed.username : '',
      password: typeof parsed.password === 'string' ? parsed.password : '',
      next: sanitizeNextPath(typeof parsed.next === 'string' ? parsed.next : '/'),
    }
  }
  const params = new URLSearchParams(text)
  return {
    username: params.get('username') ?? '',
    password: params.get('password') ?? '',
    next: sanitizeNextPath(params.get('next')),
  }
}

function renderLoginPage(options: {
  realm: string
  next: string
  error?: string
}): string {
  const realm = escapeHtml(options.realm)
  const next = escapeHtml(options.next)
  const error = options.error === undefined
    ? ''
    : `<p class="error" role="alert">${escapeHtml(options.error)}</p>`
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${realm}</title>
  <style>
    :root {
      color-scheme: light dark;
      --dsw-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
        'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      --login-bg: #ffffff;
      --login-card: #f9fafb;
      --login-border: rgba(0, 0, 0, 0.10);
      --login-label: #0f1115;
      --login-secondary: #61666b;
      --login-input: #f5f6f7;
      --login-input-border: rgba(0, 0, 0, 0.12);
      --login-button: #0f1115;
      --login-button-text: #ffffff;
      --login-button-hover: #353638;
      --login-error-bg: rgb(254, 242, 242);
      --login-error-text: rgb(236, 19, 19);
      --login-error-border: rgba(236, 19, 19, 0.18);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --login-bg: #151517;
        --login-card: #1b1b1c;
        --login-border: rgba(255, 255, 255, 0.12);
        --login-label: #f9fafb;
        --login-secondary: #cfd3d6;
        --login-input: #232324;
        --login-input-border: rgba(255, 255, 255, 0.16);
        --login-button: #f9fafb;
        --login-button-text: #0f1115;
        --login-button-hover: #ebf0f2;
        --login-error-bg: rgba(242, 90, 90, 0.12);
        --login-error-text: rgb(242, 90, 90);
        --login-error-border: rgba(242, 90, 90, 0.28);
      }
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      min-height: 100%;
      display: grid;
      place-items: center;
      font-family: var(--dsw-font-family);
      background: var(--login-bg);
      color: var(--login-label);
    }
    .shell {
      width: min(420px, calc(100vw - 32px));
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .wordmark {
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
      letter-spacing: 0.08em;
    }
    .sub {
      margin: 0;
      font-size: 12px;
      line-height: 18px;
      color: var(--login-secondary);
      text-align: center;
    }
    .card {
      background: var(--login-card);
      border: 1px solid var(--login-border);
      border-radius: 16px;
      padding: 24px;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 18px;
      line-height: 26px;
      font-weight: 600;
    }
    .hint {
      margin: 0 0 18px;
      font-size: 13px;
      line-height: 20px;
      color: var(--login-secondary);
    }
    label {
      display: block;
      font-size: 13px;
      line-height: 18px;
      margin: 0 0 6px;
      color: var(--login-secondary);
    }
    input {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--login-input-border);
      background: var(--login-input);
      color: var(--login-label);
      padding: 12px 14px;
      margin: 0 0 14px;
      font: inherit;
      font-size: 14px;
      line-height: 20px;
    }
    input:focus {
      outline: 2px solid color-mix(in srgb, var(--login-button) 35%, transparent);
      border-color: transparent;
    }
    button {
      width: 100%;
      border: 0;
      border-radius: 12px;
      padding: 12px 14px;
      background: var(--login-button);
      color: var(--login-button-text);
      font: inherit;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: var(--login-button-hover); }
    button:active { transform: translateY(0.5px); }
    .error {
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--login-error-bg);
      color: var(--login-error-text);
      border: 1px solid var(--login-error-border);
      font-size: 13px;
      line-height: 18px;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">
      <div class="wordmark">HARNESS</div>
      <p class="sub">DeepSeek Harness</p>
    </div>
    <section class="card">
      <h1>登录</h1>
      <p class="hint">使用管理员账号继续。未登录无法访问页面或调用接口。</p>
      ${error}
      <form method="post" action="${LOGIN_API_PATH}" autocomplete="username">
        <input type="hidden" name="next" value="${next}" />
        <label for="username">用户名</label>
        <input id="username" name="username" required autofocus spellcheck="false" />
        <label for="password">密码</label>
        <input id="password" name="password" type="password" required autocomplete="current-password" />
        <button type="submit">登录</button>
      </form>
    </section>
  </main>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Session table and credential checks for one auth plugin instance.
 */
export class WebAuthSessions {
  private readonly sessions = new Map<string, SessionRecord>()

  constructor(private readonly config: Config) {}

  /** Whether this deployment configured a complete account. */
  get enabled(): boolean {
    return this.config.username !== '' && this.config.password !== ''
  }

  /**
   * Validate username and password against the configured account.
   * @param username - presented username.
   * @param password - presented password.
   * @returns whether both values match.
   */
  verifyPassword(username: string, password: string): boolean {
    if (!this.enabled) return false
    return safeEqualText(this.config.username, username)
      && safeEqualText(this.config.password, password)
  }

  /**
   * Mint a new opaque session token and remember it until TTL expiry.
   * @param now - current time in milliseconds.
   * @returns the new opaque token.
   */
  mintSession(now = Date.now()): string {
    const token = randomBytes(32).toString('base64url')
    this.sessions.set(token, { expiresAt: now + this.config.sessionTtlSeconds * 1000 })
    return token
  }

  /**
   * Drop one session token.
   * @param token - token to revoke when present.
   */
  revokeSession(token: string | undefined): void {
    if (token === undefined) return
    this.sessions.delete(token)
  }

  /**
   * Whether the presented session token is currently valid.
   * @param token - presented session token.
   * @param now - current time in milliseconds.
   * @returns whether the token exists and has not expired.
   */
  hasValidSession(token: string | undefined, now = Date.now()): boolean {
    if (token === undefined) return false
    const record = this.sessions.get(token)
    if (record === undefined) return false
    if (record.expiresAt <= now) {
      this.sessions.delete(token)
      return false
    }
    record.expiresAt = now + this.config.sessionTtlSeconds * 1000
    return true
  }

  /**
   * Whether the request carries a valid session cookie or Basic pair.
   * @param req - incoming request.
   * @param now - current time in milliseconds.
   * @returns whether the request is authenticated.
   */
  isAuthenticated(req: IncomingMessage, now = Date.now()): boolean {
    if (!this.enabled) return true
    const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined
    if (this.hasValidSession(readCookie(cookieHeader, SESSION_COOKIE), now)) return true
    const basic = parseBasicAuthorization(
      typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
    )
    if (basic === undefined) return false
    return this.verifyPassword(basic.username, basic.password)
  }
}

/**
 * Build Set-Cookie writing a session token.
 * @param token - opaque session id.
 * @param ttlSeconds - max-age.
 * @param secure - whether the request arrived on HTTPS or a trusted proxy.
 * @returns a Set-Cookie header value.
 */
export function sessionSetCookie(token: string, ttlSeconds: number, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${String(ttlSeconds)}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

/**
 * Build Set-Cookie clearing the session.
 * @param secure - whether the request arrived on HTTPS or a trusted proxy.
 * @returns a Set-Cookie header value.
 */
export function clearSessionCookie(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

function requestIsSecure(req: IncomingMessage): boolean {
  const forwarded = typeof req.headers['x-forwarded-proto'] === 'string'
    ? req.headers['x-forwarded-proto'].split(',')[0]?.trim().toLowerCase()
    : undefined
  if (forwarded === 'https') return true
  return false
}

/**
 * Build the access gate bound to one session table.
 * @param config - resolved plugin config.
 * @param sessions - live session store.
 * @returns the pre-dispatch authentication gate.
 */
export function createSessionAccessGate(config: Config, sessions: WebAuthSessions): WebAccessGate {
  const challenge = `Basic realm="${config.realm.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}", charset="UTF-8"`
  return {
    allow(req: IncomingMessage): boolean {
      if (!sessions.enabled) return true
      const pathname = requestPathname(req)
      if (pathname === undefined) return false
      const method = req.method ?? 'GET'
      if (isBrowserTokenExchange(req, pathname, method)) return true
      if (isPublicAuthPath(pathname, method)) return true
      return sessions.isAuthenticated(req)
    },
    rejectHttp(res: ServerResponse, req?: IncomingMessage): void {
      if (req !== undefined && wantsHtmlLoginRedirect(req)) {
        const pathname = requestPathname(req) ?? '/'
        const next = sanitizeNextPath(pathname === LOGIN_PATH ? '/' : pathname)
        res.writeHead(302, {
          location: `${LOGIN_PATH}?next=${encodeURIComponent(next)}`,
          'cache-control': 'no-store',
        })
        res.end()
        return
      }
      res.writeHead(401, {
        'www-authenticate': challenge,
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(JSON.stringify({ error: 'unauthorized' }))
    },
    rejectUpgrade(socket: Duplex): void {
      const body = JSON.stringify({ error: 'unauthorized' })
      socket.write(
        'HTTP/1.1 401 Unauthorized\r\n'
        + `WWW-Authenticate: ${challenge}\r\n`
        + 'Connection: close\r\n'
        + `Content-Length: ${String(Buffer.byteLength(body))}\r\n`
        + 'Content-Type: application/json; charset=utf-8\r\n'
        + '\r\n'
        + body,
      )
      socket.destroy()
    },
  }
}

/**
 * Register the session gate, login page, and auth API routes.
 * @param ctx - plugin context carrying webServer.
 * @param config - resolved plugin config.
 */
export function apply(ctx: Context, config: Config): void {
  const sessions = new WebAuthSessions(config)
  const gate = createSessionAccessGate(config, sessions)

  // Prefer the request-aware reject path when the carrier provides the request.
  const wrappedGate: WebAccessGate = {
    allow: req => gate.allow(req),
    rejectHttp: (res, req) => {
      if (req !== undefined) {
        gate.rejectHttp(res, req)
        return
      }
      gate.rejectHttp(res)
    },
    rejectUpgrade: socket => gate.rejectUpgrade(socket),
  }

  ctx.effect(() => ctx.webServer.registerGate(wrappedGate), 'host-web-auth: access gate')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: LOGIN_PATH,
    handler: (req, res) => {
      if (!sessions.enabled) {
        res.writeHead(302, { location: '/' })
        res.end()
        return
      }
      if (sessions.isAuthenticated(req)) {
        res.writeHead(302, { location: '/' })
        res.end()
        return
      }
      let next = '/'
      try {
        next = sanitizeNextPath(new URL(req.url ?? '/', 'http://dsh.internal').searchParams.get('next'))
      } catch {
        next = '/'
      }
      const body = renderLoginPage({ realm: config.realm, next })
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(body)
    },
  }), 'host-web-auth: login page')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: LOGIN_API_PATH,
    handler: async (req, res) => {
      if (!sessions.enabled) {
        res.writeHead(404)
        res.end()
        return
      }
      if ((req.method ?? 'GET').toUpperCase() !== 'POST') {
        res.writeHead(405, { allow: 'POST' })
        res.end()
        return
      }
      let body: Buffer
      try {
        body = await readBody(req, 64 * 1024)
      } catch {
        res.writeHead(413)
        res.end()
        return
      }
      let parsed: { username: string; password: string; next: string }
      try {
        parsed = parseLoginBody(
          typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : undefined,
          body,
        )
      } catch {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('invalid body')
        return
      }
      if (!sessions.verifyPassword(parsed.username, parsed.password)) {
        // Cheap uniform delay reduces online password spraying usefulness.
        const digest = createHash('sha256').update(parsed.username).digest()
        const delay = 150 + (digest[0] ?? 0) % 100
        await new Promise(resolve => setTimeout(resolve, delay))
        const accept = typeof req.headers.accept === 'string' ? req.headers.accept : ''
        if (accept.includes('application/json')) {
          res.writeHead(401, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          })
          res.end(JSON.stringify({ error: 'invalid_credentials' }))
          return
        }
        const page = renderLoginPage({
          realm: config.realm,
          next: parsed.next,
          error: '用户名或密码错误',
        })
        res.writeHead(401, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        })
        res.end(page)
        return
      }
      const token = sessions.mintSession()
      const secure = requestIsSecure(req)
      const accept = typeof req.headers.accept === 'string' ? req.headers.accept : ''
      if (accept.includes('application/json')) {
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'set-cookie': sessionSetCookie(token, config.sessionTtlSeconds, secure),
          'cache-control': 'no-store',
        })
        res.end(JSON.stringify({ ok: true, next: parsed.next }))
        return
      }
      res.writeHead(302, {
        location: parsed.next,
        'set-cookie': sessionSetCookie(token, config.sessionTtlSeconds, secure),
        'cache-control': 'no-store',
      })
      res.end()
    },
  }), 'host-web-auth: login api')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: LOGOUT_API_PATH,
    handler: (req, res) => {
      const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined
      sessions.revokeSession(readCookie(cookieHeader, SESSION_COOKIE))
      const secure = requestIsSecure(req)
      const accept = typeof req.headers.accept === 'string' ? req.headers.accept : ''
      if (accept.includes('application/json')) {
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'set-cookie': clearSessionCookie(secure),
          'cache-control': 'no-store',
        })
        res.end(JSON.stringify({ ok: true }))
        return
      }
      res.writeHead(302, {
        location: LOGIN_PATH,
        'set-cookie': clearSessionCookie(secure),
        'cache-control': 'no-store',
      })
      res.end()
    },
  }), 'host-web-auth: logout api')
}
