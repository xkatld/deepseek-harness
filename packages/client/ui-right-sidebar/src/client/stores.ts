import { defineStore } from '@deepseek-ai/dsh-client-store'

interface RightSidebarState { activeId: string | null }

/** Create the right-sidebar view-state store.
 * @returns the sidebar's entry-scoped viewing-state handle.
 */
export function createRightSidebarStore() {
  return defineStore({
    init: (): RightSidebarState => ({ activeId: null }),
    actions: { activate: (draft, id: string) => { draft.activeId = id } },
  })
}
