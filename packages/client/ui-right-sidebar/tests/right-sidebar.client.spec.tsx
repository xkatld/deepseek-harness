// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from '../src/client/index.ts'
import type { SessionProviderComponent } from '@deepseek-ai/dsh-client-ui-slots'
import type { RightSidebarContentOwnerProps, RightSidebarTabOwnerProps } from '../src/client/RightSidebar.tsx'
import { RightSidebarOpener, RightSidebarShell } from '../src/client/RightSidebar.tsx'
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
        sessionId={'s1' as never}
        useSession={neverHook}
        useSessions={((selector: (state: { byId: Record<string, { cwd: string }> }) => unknown) => selector({ byId: { s1: { cwd: '/repo' } } })) as never}
        useWorkspaces={neverHook}
        useTrajectory={neverHook}
        useChat={neverHook}
        useConversation={neverHook}
        useSessionPendingInteraction={neverHook}
        useProjection={neverHook}
        useInput={neverHook}
        inputActions={{} as never}
        useStore={((selector: (state: ReturnType<typeof instance.store.getSnapshot>) => unknown) =>
          selector(instance.store.getSnapshot())) as never}
        actions={instance.actions}
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
    expect(contentOwner).toEqual({ cwd: '/repo', closeDetails: close })
    expect(contentOnly).toBe('panel-a')
    fireEvent.click(screen.getByRole('button', { name: 'Close right sidebar' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('uses a generic panel glyph for the shell opener', () => {
    const show = vi.fn()
    const view = render(
      <RightSidebarOpener
        session={{} as never}
        input={{} as never}
        sessionId={'s1' as never}
        useSession={neverHook}
        useSessions={neverHook}
        useWorkspaces={neverHook}
        useTrajectory={neverHook}
        useChat={neverHook}
        useConversation={neverHook}
        useSessionPendingInteraction={neverHook}
        useProjection={neverHook}
        useInput={neverHook}
        inputActions={{} as never}
        show={show}
        t={t}
      />,
    )
    const button = screen.getByRole('button', { name: 'Open right sidebar' })
    expect(view.container.querySelector('rect')).not.toBeNull()
    fireEvent.click(button)
    expect(show).toHaveBeenCalledOnce()
  })
})
