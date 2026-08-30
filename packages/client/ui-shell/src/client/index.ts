import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-right-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { ShellPanel } from './ShellPanel.tsx'
import { ShellTab } from './ShellContributions.tsx'
import { en, zh, type ShellKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { shellPanel: ShellKey } }

export const inject = ['slots', 'locale', 'remote', 'remote.shell', 'rightSidebar']
export function apply(ctx: Context): void {
  ctx.locale.register('shellPanel', { zh, en })
  ctx.slots.inject('right-sidebar.tabs', () => ctx.slots.register({ name: 'right-sidebar.tabs', id: 'shell', order: 10, locale: 'shellPanel' }, ShellTab))
  ctx.slots.inject('right-sidebar.content', () => ctx.slots.register({ name: 'right-sidebar.content', id: 'shell', order: 10, locale: 'shellPanel', inject: () => ({ shell: ctx.remote.shell }) }, ShellPanel))
}
