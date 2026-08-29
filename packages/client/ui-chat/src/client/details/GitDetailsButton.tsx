import { IconBranchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GitDetailsButton.module.css'

interface GitDetailsButtonInjected {
  openGitDetails: () => void
}

type GitHeaderButtonProps = PropsRuntime<'conversation.session.header.utilities'>
  & PropsLocale<'chat'>
  & InjectFace<GitDetailsButtonInjected>

type GitComposerButtonProps = PropsRuntime<'conversation.input.right'>
  & PropsLocale<'chat'>
  & InjectFace<GitDetailsButtonInjected>

function GitDetailsButton({ openGitDetails, t }: GitHeaderButtonProps | GitComposerButtonProps) {
  return (
    <button type="button" className={css.button} aria-label={t('details.openGit')} title={t('details.openGit')} onClick={openGitDetails}>
      <IconBranchOutline16 size={16} />
    </button>
  )
}

/** Open Git details from the Session header. */
export function GitHeaderButton(props: GitHeaderButtonProps) {
  return <GitDetailsButton {...props} />
}

/** Open Git details from the resident composer. */
export function GitComposerButton(props: GitComposerButtonProps) {
  return <GitDetailsButton {...props} />
}
