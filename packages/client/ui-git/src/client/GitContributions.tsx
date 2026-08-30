import { IconGitOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GitContributions.module.css'

type GitTabProps = PropsRuntime<'right-sidebar.tabs'> & PropsLocale<'gitPanel'>

/** Git-owned tab contribution for the independent right sidebar. */
export function GitTab({ activeId, collapsed, activate, t }: GitTabProps) {
  return (
    <button type="button" className={css.tab} role="tab" aria-label={collapsed ? t('title') : undefined} title={collapsed ? t('title') : undefined} aria-selected={activeId === 'git'} onClick={() => { activate('git') }}>
      <IconGitOutline16 size={collapsed ? 20 : 16} />{!collapsed && t('title')}
    </button>
  )
}
