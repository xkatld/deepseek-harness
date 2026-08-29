import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { RightSidebarOpener, RightSidebarShell, type RightSidebarContentOwnerProps, type RightSidebarTabOwnerProps } from './RightSidebar.tsx'
import { RightSidebarController, type IRightSidebar } from './service.ts'
import { createRightSidebarStore } from './stores.ts'
import { en, type RightSidebarKey, zh } from './locales.ts'

const NS = 'rightSidebar'

declare module '@deepseek-ai/cordis' {
  interface Context { rightSidebar: IRightSidebar }
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { rightSidebar: RightSidebarKey }
  interface SlotMap {
    'right-sidebar.tabs': { kind: 'list'; scope: 'session'; owner: RightSidebarTabOwnerProps }
    'right-sidebar.content': { kind: 'list'; scope: 'session'; owner: RightSidebarContentOwnerProps }
  }
}

/** Required client services. */
export const inject = ['slots', 'locale', 'layout']

/** Register the generic right-sidebar shell, service, and opener. */
export function apply(ctx: Context): void {
  ctx.locale.register(NS, { zh, en })
  const store = createRightSidebarStore()
  const service = new RightSidebarController(ctx.layout)
  ctx.effect(() => {
    const disposeService = ctx.reflect.provide('rightSidebar', service)
    const disposeShell = ctx.slots.inject('details', () => ctx.slots.register({
      name: 'details',
      locale: NS,
      children: {
        'right-sidebar.tabs': { kind: 'list', scope: 'session' },
        'right-sidebar.content': { kind: 'list', scope: 'session' },
      },
      store,
      inject: (_sessionId: SessionId, actions: BoundActions<typeof store>) => {
        service.attach(actions)
        return { close: () => { service.close() } }
      },
    }, RightSidebarShell))
    const disposeOpener = ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
      name: 'conversation.input.right', id: 'right-sidebar', order: 25, locale: NS,
      inject: () => ({ show: () => { service.show() } }),
    }, RightSidebarOpener))
    return () => { disposeOpener(); disposeShell(); void disposeService() }
  }, 'ui-right-sidebar: service and slots')
}

export type { IRightSidebar }
export type { RightSidebarContentOwnerProps, RightSidebarTabOwnerProps } from './RightSidebar.tsx'
export { createRightSidebarStore }
