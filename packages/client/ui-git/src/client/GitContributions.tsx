import { IconBranchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GitContributions.module.css'

type GitTabProps = PropsRuntime<'right-sidebar.tabs'> & PropsLocale<'gitPanel'>
interface GitOpenerInjected { openGit: () => void }
type GitOpenerProps = PropsRuntime<'conversation.input.right'> & PropsLocale<'gitPanel'> & InjectFace<GitOpenerInjected>

/** Git-owned tab contribution for the independent right sidebar. */
export function GitTab({ activeId, activate, t }: GitTabProps) {
  return (
    <button type="button" className={css.tab} role="tab" aria-selected={activeId === 'git'} onClick={() => { activate('git') }}>
      <IconBranchOutline16 size={14} />{t('title')}
    </button>
  )
}

/** Git-owned composer entry that opens the Git sidebar contribution. */
export function GitOpener({ openGit, t }: GitOpenerProps) {
  return (
    <button type="button" className={css.opener} aria-label={t('open')} title={t('open')} onClick={openGit}>
      <IconBranchOutline16 size={16} />
    </button>
  )
}
