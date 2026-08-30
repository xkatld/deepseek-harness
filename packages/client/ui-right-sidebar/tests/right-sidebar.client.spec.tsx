// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from '../src/client/index.ts'
import type { SessionProviderComponent } from '@deepseek-ai/dsh-client-ui-slots'
import type { RightSidebarContentOwnerProps, RightSidebarTabOwnerProps } from '../src/client/RightSidebar.tsx'
import { RightSidebarShell } from '../src/client/RightSidebar.tsx'
import { createRightSidebarStore } from '../src/client/stores.ts'
import { en } from '../src/client/locales.ts'

const t = ((key: keyof typeof en) => en[key]) as never
const SessionProviderStub: SessionProviderComponent = ({ children }) => children
const neverHook = (() => { throw new Error('unused framework hook') }) as never

afterEach(cleanup)

describe('RightSidebar UI', () => {
  it('renders generic chrome and filters content by the active contribution id', () => {
    const instance = createRightSidebarStore().create()
    instance.actions.activate('panel-a')
    const close = vi.fn()
    let tabOwner: RightSidebarTabOwnerProps | undefined
    let contentOwner: RightSidebarContentOwnerProps | undefined
    let contentOnly: string | undefined

    render(
      <RightSidebarShell
        SessionProvider={SessionProviderStub}
        useSessions={((selector: (state: { current: string; byId: Record<string, { cwd: string }> }) => unknown) => selector({ current: 's1', byId: { s1: { cwd: '/repo' } } })) as never}
        useWorkspaces={neverHook}
        useSessionPendingInteraction={neverHook}
        useStore={((selector: (state: ReturnType<typeof instance.store.getSnapshot>) => unknown) =>
          selector(instance.store.getSnapshot())) as never}
        actions={instance.actions}
        collapsed={false}
        width={360}
        activate={instance.actions.activate}
        expand={vi.fn()}
        close={close}
        t={t}
        renderSlot={((key: string, owner: RightSidebarTabOwnerProps | RightSidebarContentOwnerProps, options?: { only?: string }) => {
          if (key === 'right-sidebar.tabs') { tabOwner = owner as RightSidebarTabOwnerProps; return <span>tabs</span> }
          contentOwner = owner as RightSidebarContentOwnerProps
          contentOnly = options?.only
          return <span>content</span>
        }) as never}
      />,
    )

    expect(screen.getByRole('complementary', { name: 'Right sidebar' })).toBeTruthy()
    expect(tabOwner?.activeId).toBe('panel-a')
    expect(tabOwner?.collapsed).toBe(false)
    expect(contentOwner).toEqual({ cwd: '/repo', sessionId: 's1', closeDetails: close })
    expect(contentOnly).toBe('panel-a')
    fireEvent.click(screen.getByRole('button', { name: 'Close right sidebar' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('keeps plugin tabs visible in the collapsed rail and hides panel content', () => {
    const instance = createRightSidebarStore().create()
    const activate = vi.fn()
    const expand = vi.fn()
    const rendered: string[] = []
    render(
      <RightSidebarShell
        collapsed
        width={48}
        SessionProvider={SessionProviderStub}
        useSessions={((selector: (state: { current?: string; byId: Record<string, never> }) => unknown) => selector({ byId: {} })) as never}
        useWorkspaces={neverHook}
        useSessionPendingInteraction={neverHook}
        useStore={((selector: (state: ReturnType<typeof instance.store.getSnapshot>) => unknown) =>
          selector(instance.store.getSnapshot())) as never}
        actions={instance.actions}
        activate={activate}
        expand={expand}
        close={vi.fn()}
        t={t}
        renderSlot={((key: string, owner: RightSidebarTabOwnerProps) => {
          rendered.push(key)
          if (key === 'right-sidebar.tabs') {
            expect(owner.collapsed).toBe(true)
            owner.activate('git')
          }
          return <span>{key}</span>
        }) as never}
      />,
    )

    expect(rendered).toEqual(['right-sidebar.tabs'])
    expect(activate).toHaveBeenCalledWith('git')
    fireEvent.click(screen.getByRole('button', { name: 'Open right sidebar' }))
    expect(expand).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Close right sidebar' })).toBeNull()
  })
})
