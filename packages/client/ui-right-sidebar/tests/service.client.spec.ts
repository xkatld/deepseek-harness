import { describe, expect, it, vi } from 'vitest'
import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client'
import { RightSidebarController } from '../src/client/service.ts'
import { createRightSidebarStore } from '../src/client/stores.ts'

function layoutFake(): ILayout {
  return { toggleSidebar: vi.fn(), openDetails: vi.fn(), closeDetails: vi.fn() }
}

describe('RightSidebarController', () => {
  it('selects a contribution before opening the layout column', () => {
    const layout = layoutFake()
    const instance = createRightSidebarStore().create()
    const sidebar = new RightSidebarController(layout)
    sidebar.attach(instance.actions)

    sidebar.open('panel-a')

    expect(instance.store.getSnapshot().activeId).toBe('panel-a')
    expect(layout.openDetails).toHaveBeenCalledOnce()
  })

  it('shows and closes the generic column without feature knowledge', () => {
    const layout = layoutFake()
    const instance = createRightSidebarStore().create()
    const sidebar = new RightSidebarController(layout)
    sidebar.attach(instance.actions)

    sidebar.show()
    sidebar.close()

    expect(instance.store.getSnapshot().activeId).toBeNull()
    expect(layout.openDetails).toHaveBeenCalledOnce()
    expect(layout.closeDetails).toHaveBeenCalledOnce()
  })

  it('fails loud before the shell store is attached', () => {
    const sidebar = new RightSidebarController(layoutFake())
    expect(() => { sidebar.open('panel-a') }).toThrow(/shell actions not wired/)
  })
})
