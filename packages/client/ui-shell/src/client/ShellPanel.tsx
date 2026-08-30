import { useEffect, useState } from 'react'
import type { ShellOpenValue, ShellSendValue } from '@deepseek-ai/dsh-api-shell/types'
import type { RightSidebarContentOwnerProps } from '@deepseek-ai/dsh-client-ui-right-sidebar/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import css from './ShellPanel.module.css'

interface ShellRemote {
  open(request: { sessionId: SessionId; cwd: string }): Promise<RemoteResult<ShellOpenValue>>
  send(request: { sessionId: SessionId; terminalId: string; text: string }): Promise<RemoteResult<ShellSendValue>>
  close(request: { sessionId: SessionId; terminalId: string }): Promise<RemoteResult<{ closed: boolean }>>
}
function value<T>(result: RemoteResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export type ShellPanelProps = PropsRuntime<'right-sidebar.content'>
  & RightSidebarContentOwnerProps
  & PropsLocale<'shellPanel'>
  & InjectFace<{ shell: ShellRemote }>

export function ShellPanel({ cwd, sessionId, shell, t }: ShellPanelProps) {
  const [terminal, setTerminal] = useState<ShellOpenValue | null>(null)
  const [output, setOutput] = useState('')
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { setTerminal(null); setOutput('') }, [cwd, sessionId])
  const start = async () => {
    if (cwd === undefined || sessionId === undefined) return
    setLoading(true)
    try {
      const opened = value(await shell.open({ sessionId: sessionId as SessionId, cwd }))
      setTerminal(opened)
      setOutput(opened.output)
    } finally { setLoading(false) }
  }
  const send = async () => {
    if (terminal === null || sessionId === undefined || command.trim() === '') return
    setLoading(true)
    try {
      const result = value(await shell.send({
        sessionId: sessionId as SessionId, terminalId: terminal.terminalId, text: command,
      }))
      setOutput(result.output)
      setCommand('')
    } finally { setLoading(false) }
  }
  if (cwd === undefined || sessionId === undefined) return <div className={css.state}>{t('noCwd')}</div>
  return <div className={css.root}>
    <div className={css.toolbar}>
      <strong>Shell</strong><code title={cwd}>{cwd}</code>
      <button type="button" onClick={() => { void start() }} disabled={loading}>
        {terminal === null ? t('open') : t('restart')}
      </button>
    </div>
    {terminal === null ? null : <>
      <pre className={css.output}>{output}</pre>
      <form className={css.input} onSubmit={(event) => { event.preventDefault(); void send() }}>
        <span>$</span>
        <input
          value={command}
          onChange={(event) => { setCommand(event.target.value) }}
          disabled={loading}
          aria-label={t('command')}
          autoComplete="off"
        />
        <button type="submit" disabled={loading || command.trim() === ''}>{t('run')}</button>
      </form>
    </>}
  </div>
}
