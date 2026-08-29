import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { createRightSidebarStore } from './stores.ts'
import css from './RightSidebar.module.css'

/** Data passed by the sidebar shell to tab contributions. */
export interface RightSidebarTabOwnerProps {
  activeId: string | null
  activate: (id: string) => void
}

/** Data passed by the sidebar shell to the active content contribution. */
export interface RightSidebarContentOwnerProps {
  cwd?: string
  closeDetails: () => void
}

interface ShellInjected { close: () => void }
type ShellProps = PropsRuntime<'details'>
  & PropsRenderSlots<'right-sidebar.tabs' | 'right-sidebar.content'>
  & PropsStore<ReturnType<typeof createRightSidebarStore>>
  & PropsLocale<'rightSidebar'>
  & InjectFace<ShellInjected>

/** Render the generic right-sidebar chrome around feature contributions. */
export function RightSidebarShell({ useStore, actions, useSessions, sessionId, renderSlot, close, t }: ShellProps) {
  const activeId = useStore(state => state.activeId)
  const cwd = useSessions(state => state.byId[sessionId]?.cwd)
  return (
    <aside className={css.root} aria-label={t('title')}>
      <header className={css.header}>
        <div className={css.tabs} role="tablist" aria-label={t('tabs')}>
          {renderSlot('right-sidebar.tabs', { activeId, activate: actions.activate })}
        </div>
        <button type="button" className={css.close} aria-label={t('close')} onClick={close}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <div className={css.body}>
        {activeId === null
          ? <div className={css.empty}>{t('empty')}</div>
          : renderSlot('right-sidebar.content', { ...(cwd === undefined ? {} : { cwd }), closeDetails: close }, { only: activeId, fallback: <div className={css.empty}>{t('unavailable')}</div> })}
      </div>
    </aside>
  )
}

interface OpenerInjected { show: () => void }
type OpenerProps = PropsRuntime<'conversation.input.right'> & PropsLocale<'rightSidebar'> & InjectFace<OpenerInjected>

/** Open the generic right sidebar without selecting a feature. */
export function RightSidebarOpener({ show, t }: OpenerProps) {
  return (
    <button type="button" className={css.opener} aria-label={t('open')} title={t('open')} onClick={show}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        <rect x="1.75" y="2.25" width="12.5" height="11.5" rx="1.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.75v10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  )
}
