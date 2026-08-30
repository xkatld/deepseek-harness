import { IconTerminalOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './ShellContributions.module.css'

type ShellTabProps = PropsRuntime<'right-sidebar.tabs'> & PropsLocale<'shellPanel'>
export function ShellTab({ activeId, collapsed, activate, t }: ShellTabProps) {
  return <button type="button" className={css.tab} role="tab" aria-label={collapsed ? t('title') : undefined} title={collapsed ? t('title') : undefined} aria-selected={activeId === 'shell'} onClick={() => { activate('shell') }}><IconTerminalOutline16 size={collapsed ? 20 : 16} />{!collapsed && t('title')}</button>
}
