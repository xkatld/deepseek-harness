import type { DetailsOwnerProps } from '@deepseek-ai/dsh-client-ui-layout/client'
import { IconPanelRightOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { createRightSidebarStore } from './stores.ts'
import css from './RightSidebar.module.css'

/** Data passed by the sidebar shell to tab contributions. */
export interface RightSidebarTabOwnerProps {
  activeId: string | null
  collapsed: boolean
  activate: (id: string) => void
}

/** Data passed by the sidebar shell to the active content contribution. */
export interface RightSidebarContentOwnerProps {
  cwd?: string
  closeDetails: () => void
}

interface ShellInjected { activate: (id: string) => void; expand: () => void; close: () => void }
type ShellProps = PropsRuntime<'details'>
  & DetailsOwnerProps
  & PropsRenderSlots<'right-sidebar.tabs' | 'right-sidebar.content'>
  & PropsStore<ReturnType<typeof createRightSidebarStore>>
  & PropsLocale<'rightSidebar'>
  & InjectFace<ShellInjected>

/** Render the generic right-sidebar chrome around feature contributions. */
export function RightSidebarShell({
  collapsed, useStore, useSessions, SessionProvider, renderSlot, activate, expand, close, t,
}: ShellProps) {
  const activeId = useStore(state => state.activeId)
  const cwd = useSessions((state) => {
    const current = state.current
    return current === undefined ? undefined : state.byId[current]?.cwd
  })
  return (
    <aside className={css.root} data-collapsed={collapsed || undefined} aria-label={t('title')}>
      <header className={css.header}>
        <div className={css.tabs} role="tablist" aria-label={t('tabs')}>
          <SessionProvider>{renderSlot('right-sidebar.tabs', { activeId, collapsed, activate })}</SessionProvider>
        </div>
        {collapsed
          ? <button type="button" className={css.toggle} aria-label={t('open')} title={t('open')} onClick={expand}>
            <IconPanelRightOutline16 size={18} />
          </button>
          : <button type="button" className={css.toggle} aria-label={t('close')} title={t('close')} onClick={close}>
            <IconPanelRightOutline16 size={16} />
          </button>}
      </header>
      {!collapsed && <div className={css.body}>
        {activeId === null
          ? <div className={css.empty}>{t('empty')}</div>
          : renderSlot('right-sidebar.content', { ...(cwd === undefined ? {} : { cwd }), closeDetails: close }, { only: activeId, fallback: <div className={css.empty}>{t('unavailable')}</div> })}
      </div>}
    </aside>
  )
}
