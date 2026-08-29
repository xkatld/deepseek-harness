/**
 * REAL-composition coverage for the session login gate: Loader-mounted
 * webserver plus this plugin, observing login redirects, cookie sessions,
 * public assets, API refusal, and upgrade refusal.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import HttpServer from '@deepseek-ai/dsh-host-webserver'
import * as WebAuth from '../src/index.ts'
import {
  LOGIN_API_PATH,
  LOGIN_PATH,
  parseBasicAuthorization,
  parseLoginBody,
  readCookie,
  sanitizeNextPath,
  SESSION_COOKIE,
} from '../src/index.ts'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

async function loadComposition(options: {
  username?: string
  password?: string
}): Promise<Context> {
  root = await mkdtemp(join(tmpdir(), 'dsh-web-auth-loader-'))
  const configPath = join(root, 'cordis.yml')
  await writeFile(configPath, [
    "- name: '@deepseek-ai/dsh-host-webserver'",
    '  config:',
    "    host: '127.0.0.1'",
    '    port: 0',
    "- name: '@deepseek-ai/dsh-host-web-auth'",
    '  config:',
    `    username: ${JSON.stringify(options.username ?? '')}`,
    `    password: ${JSON.stringify(options.password ?? '')}`,
    '',
  ].join('\n'))

  context = new Context()
  context.baseUrl = `${pathToFileURL(root).href}/`
  await context.plugin(Loader)
  context.loader.builtins.include = Include
  const modules = new Map<string, unknown>([
    ['@deepseek-ai/dsh-host-webserver', HttpServer],
    ['@deepseek-ai/dsh-host-web-auth', WebAuth],
  ])
  context.loader.internal = {
    version: 'v2',
    async import(specifier: string) {
      if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
      return modules.get(specifier)
    },
  } as unknown as NonNullable<typeof context.loader.internal>
  await context.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await context.loader.await()
  return context
}

async function request(
  port: number,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: string; headers: Headers; location: string | null }> {
  const response = await fetch(`http://127.0.0.1:${String(port)}${path}`, {
    redirect: 'manual',
    ...init,
  })
  return {
    status: response.status,
    body: await response.text(),
    headers: response.headers,
    location: response.headers.get('location'),
  }
}

function basicHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`
}

function cookieFromSetCookie(setCookie: string | null): string {
  if (setCookie === null) throw new Error('missing set-cookie')
  return setCookie.split(';', 1)[0] ?? ''
}

async function upgrade(
  port: number,
  path: string,
  headers: string[] = [],
): Promise<{ statusLine: string; body: string }> {
  const socket = connect(port, '127.0.0.1')
  await once(socket, 'connect')
  const response = once(socket, 'data')
  socket.write([
    `GET ${path} HTTP/1.1`,
    `Host: 127.0.0.1:${String(port)}`,
    'Connection: Upgrade',
    'Upgrade: dsh-test',
    ...headers,
    '',
    '',
  ].join('\r\n'))
  const [data] = await response as [Buffer]
  const text = String(data)
  socket.destroy()
  const separator = text.indexOf('\r\n\r\n')
  return {
    statusLine: text.split('\r\n')[0] ?? '',
    body: separator < 0 ? '' : text.slice(separator + 4),
  }
}

describe('auth helpers', () => {
  it('parses Basic, cookies, login bodies, and next paths', () => {
    expect(parseBasicAuthorization(basicHeader('alice', 's:ecret'))).toEqual({
      username: 'alice',
      password: 's:ecret',
    })
    expect(parseBasicAuthorization(undefined)).toBeUndefined()
    expect(readCookie(`${SESSION_COOKIE}=abc; other=1`, SESSION_COOKIE)).toBe('abc')
    expect(sanitizeNextPath('https://evil.example')).toBe('/')
    expect(sanitizeNextPath('//evil.example')).toBe('/')
    expect(sanitizeNextPath('/workspace?x=1')).toBe('/workspace?x=1')
    expect(parseLoginBody('application/x-www-form-urlencoded', Buffer.from('username=a&password=b&next=/x'))).toEqual({
      username: 'a',
      password: 'b',
      next: '/x',
    })
    expect(parseLoginBody('application/json', Buffer.from('{"username":"a","password":"b","next":"/y"}'))).toEqual({
      username: 'a',
      password: 'b',
      next: '/y',
    })
  })
})

describe('real Loader composition', () => {
  it('leaves the carrier open when credentials are empty', { timeout: 60_000 }, async () => {
    const loaded = await loadComposition({})
    const port = loaded.webServer.port
    loaded.webServer.register({
      kind: 'exact',
      path: '/probe',
      handler: (_req, res) => {
        res.writeHead(200)
        res.end('OPEN')
      },
    })
    expect(await request(port, '/probe')).toMatchObject({ status: 200, body: 'OPEN' })
  })

  it('redirects browser navigations to the login page and blocks API without a session', { timeout: 60_000 }, async () => {
    const loaded = await loadComposition({ username: 'alice', password: 's3cret' })
    const port = loaded.webServer.port
    loaded.webServer.register({
      kind: 'exact',
      path: '/',
      handler: (_req, res) => {
        res.writeHead(200)
        res.end('TOKEN EXCHANGE')
      },
    })
    loaded.webServer.register({
      kind: 'exact',
      path: '/probe',
      handler: (_req, res) => {
        res.writeHead(200)
        res.end('OK')
      },
    })
    loaded.webServer.register({
      kind: 'exact',
      path: '/manifest.webmanifest',
      handler: (_req, res) => {
        res.writeHead(200, { 'content-type': 'application/manifest+json' })
        res.end('{}')
      },
    })
    loaded.webServer.registerUpgrade({
      path: '/events',
      handler: (_req, socket) => {
        socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: dsh-test\r\nConnection: Upgrade\r\n\r\n')
      },
    })

    const tokenExchange = await request(port, '/?token=official-launch-token')
    expect(tokenExchange).toMatchObject({ status: 200, body: 'TOKEN EXCHANGE' })

    const duplicateToken = await request(port, '/?token=one&token=two', {
      headers: { accept: 'text/html', 'sec-fetch-dest': 'document' },
    })
    expect(duplicateToken.status).toBe(302)
    expect(duplicateToken.location).toBe(`${LOGIN_PATH}?next=${encodeURIComponent('/')}`)

    const redirected = await request(port, '/probe', {
      headers: { accept: 'text/html', 'sec-fetch-dest': 'document' },
    })
    expect(redirected.status).toBe(302)
    expect(redirected.location).toBe(`${LOGIN_PATH}?next=${encodeURIComponent('/probe')}`)

    const loginPage = await request(port, LOGIN_PATH)
    expect(loginPage.status).toBe(200)
    expect(loginPage.body).toContain('用户名')
    expect(loginPage.body).toContain(LOGIN_API_PATH)

    const deniedApi = await request(port, '/probe')
    expect(deniedApi.status).toBe(401)
    expect(deniedApi.body).toContain('unauthorized')

    const publicManifest = await request(port, '/manifest.webmanifest')
    expect(publicManifest.status).toBe(200)
    expect(publicManifest.body).toBe('{}')

    const wrong = await request(port, LOGIN_API_PATH, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'text/html',
      },
      body: 'username=alice&password=nope&next=/probe',
    })
    expect(wrong.status).toBe(401)
    expect(wrong.body).toContain('用户名或密码错误')

    const login = await request(port, LOGIN_API_PATH, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'text/html',
      },
      body: 'username=alice&password=s3cret&next=/probe',
    })
    expect(login.status).toBe(302)
    expect(login.location).toBe('/probe')
    const cookie = cookieFromSetCookie(login.headers.get('set-cookie'))
    expect(cookie.startsWith(`${SESSION_COOKIE}=`)).toBe(true)

    const allowed = await request(port, '/probe', {
      headers: { cookie },
    })
    expect(allowed).toMatchObject({ status: 200, body: 'OK' })

    const deniedUpgrade = await upgrade(port, '/events')
    expect(deniedUpgrade.statusLine).toContain('401')

    const allowedUpgrade = await upgrade(port, '/events', [`Cookie: ${cookie}`])
    expect(allowedUpgrade.statusLine).toContain('101')

    const basicAllowed = await request(port, '/probe', {
      headers: { authorization: basicHeader('alice', 's3cret') },
    })
    expect(basicAllowed).toMatchObject({ status: 200, body: 'OK' })
  })

  it('removes the gate when the owning fiber disposes', { timeout: 60_000 }, async () => {
    const loaded = await loadComposition({ username: 'alice', password: 's3cret' })
    const port = loaded.webServer.port
    loaded.webServer.register({
      kind: 'exact',
      path: '/probe',
      handler: (_req, res) => {
        res.writeHead(200)
        res.end('OPEN')
      },
    })
    const authEntry = [...loaded.loader.entries()].find(entry => entry.options.name === '@deepseek-ai/dsh-host-web-auth')
    expect(authEntry?.fiber).toBeDefined()
    await authEntry!.fiber!.dispose()
    expect(await request(port, '/probe')).toMatchObject({ status: 200, body: 'OPEN' })
  })
})
