import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { createRightSidebarStore } from './stores.ts'

type SidebarActions = BoundActions<ReturnType<typeof createRightSidebarStore>>

/** Operations exposed to right-sidebar feature plugins. */
export interface IRightSidebar {
  /** Display the contribution registered under `id`. */
  open(id: string): void
  /** Display the sidebar without changing its active contribution. */
  show(): void
  /** Close the sidebar column. */
  close(): void
}

/** Connects feature requests to the sidebar store and layout column. */
export class RightSidebarController implements IRightSidebar {
  #actions: SidebarActions | undefined

  constructor(private readonly layout: ILayout) {}

  /** Attach the shell registration's bound store actions. */
  attach(actions: SidebarActions): void { this.#actions = actions }

  /** Display the contribution registered under `id`. */
  open(id: string): void {
    this.#require().activate(id)
    this.layout.openDetails()
  }

  /** Display the sidebar without changing its active contribution. */
  show(): void { this.layout.openDetails() }

  /** Close the sidebar column. */
  close(): void { this.layout.closeDetails() }

  #require(): SidebarActions {
    if (this.#actions === undefined) throw new Error('right-sidebar: shell actions not wired')
    return this.#actions
  }
}
