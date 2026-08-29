import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { GitPanelInjected } from './GitPanel.tsx'
import { GitPanel } from './GitPanel.tsx'
import { en, zh, type GitKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { git: GitKey }
}
const NS = 'git'
export const inject = ['slots', 'locale', 'remote', 'remote.git']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-git: dictionaries')
  type Result<Value> = { ok: true; value: Value } | { ok: false; error: { code: string; message: string } }
  const unwrap = async <Value>(operation: Promise<Result<Value>>): Promise<Value> => {
    const result = await operation
    if (!result.ok) throw new Error(`Git Remote failed: ${result.error.code}: ${result.error.message}`)
    return result.value
  }
  const injected = (): GitPanelInjected => ({
    status: path => unwrap(ctx.remote.git.status(path === undefined ? {} : { path })),
    history: path => unwrap(ctx.remote.git.history(path === undefined ? {} : { path })),
    commitFiles: (path, commit) => unwrap(ctx.remote.git.commitFiles({ ...(path === undefined ? {} : { path }), commit })),
    diff: (path, commit) => unwrap(ctx.remote.git.diff({ ...(path === undefined ? {} : { path }), commit })),
  })
  ctx.slots.inject('conversation.details.git', () => ctx.slots.register({ name: 'conversation.details.git', locale: NS, inject: injected }, GitPanel))
}
