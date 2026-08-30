import { useCallback, useEffect, useRef, useState } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import type {
  ShellCloseValue, ShellOpenValue, ShellOutputFrame, ShellResizeValue, ShellWriteValue,
} from '@deepseek-ai/dsh-api-shell/types'
import { IconPlayOutline16, IconRefreshOutline16, IconTerminalOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { RightSidebarContentOwnerProps } from '@deepseek-ai/dsh-client-ui-right-sidebar/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import css from './ShellPanel.module.css'

interface ShellRemote {
  open(request: { sessionId: SessionId; cwd: string; cols: number; rows: number }): Promise<RemoteResult<ShellOpenValue>>
  write(request: { sessionId: SessionId; terminalId: string; data: string }): Promise<RemoteResult<ShellWriteValue>>
  resize(request: { sessionId: SessionId; terminalId: string; cols: number; rows: number }): Promise<RemoteResult<ShellResizeValue>>
  follow(request: { sessionId: SessionId; terminalId: string; cursor: number }, signal?: AbortSignal): AsyncIterable<ShellOutputFrame>
  close(request: { sessionId: SessionId; terminalId: string }): Promise<RemoteResult<ShellCloseValue>>
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
  const surfaceRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal>()
  const fitRef = useRef<FitAddon>()
  const terminalIdRef = useRef<string>()
  const streamRef = useRef<AbortController>()
  const generationRef = useRef(0)
  const [status, setStatus] = useState<'idle' | 'opening' | 'connected' | 'exited' | 'error'>('idle')
  const [error, setError] = useState<string>()

  const closeTerminal = useCallback(async () => {
    generationRef.current += 1
    streamRef.current?.abort()
    streamRef.current = undefined
    const terminalId = terminalIdRef.current
    terminalIdRef.current = undefined
    terminalRef.current?.reset()
    if (terminalId !== undefined) {
      try { await shell.close({ sessionId, terminalId }) } catch { /* The owner may already be gone. */ }
    }
  }, [sessionId, shell])

  useEffect(() => {
    const element = surfaceRef.current
    if (element === null) return
    const terminal = new Terminal({
      allowProposedApi: false,
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'Cascadia Mono, JetBrains Mono, SFMono-Regular, Consolas, Liberation Mono, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      scrollback: 10_000,
      theme: {
        background: '#071019', foreground: '#d7e0e8', cursor: '#65d1ff', cursorAccent: '#071019',
        selectionBackground: '#274760', black: '#071019', red: '#ff6b6b', green: '#73daca', yellow: '#e0af68',
        blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#c0caf5', brightBlack: '#56718a',
      },
    })
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(element)
    terminalRef.current = terminal
    fitRef.current = fit
    const data = terminal.onData((input) => {
      const terminalId = terminalIdRef.current
      if (terminalId === undefined) return
      void shell.write({ sessionId, terminalId, data: input }).then(value).catch((failure: unknown) => {
        const message = failure instanceof Error ? failure.message : String(failure)
        setError(message.includes('no sandbox backend') || message.includes('workspace-write')
          ? t('sandboxUnavailable')
          : message)
        setStatus('error')
      })
    })
    let frame = 0
    let lastSize = ''
    const fitAndResize = (): void => {
      frame = 0
      try { fit.fit() } catch { return }
      const terminalId = terminalIdRef.current
      if (terminalId === undefined) return
      const size = `${terminal.cols}x${terminal.rows}`
      if (size === lastSize) return
      lastSize = size
      void shell.resize({
        sessionId, terminalId, cols: terminal.cols, rows: terminal.rows,
      }).then(value).catch(() => {})
    }
    const observer = new ResizeObserver(() => {
      if (frame !== 0) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fitAndResize)
    })
    observer.observe(element)
    frame = requestAnimationFrame(fitAndResize)
    return () => {
      void closeTerminal()
      if (frame !== 0) cancelAnimationFrame(frame)
      observer.disconnect()
      data.dispose()
      terminal.dispose()
      terminalRef.current = undefined
      fitRef.current = undefined
    }
  }, [closeTerminal, sessionId, shell])

  useEffect(() => {
    void closeTerminal().then(() => {
      setStatus('idle')
      setError(undefined)
    })
  }, [closeTerminal, cwd, sessionId])

  const openTerminal = async (): Promise<void> => {
    if (cwd === undefined || terminalRef.current === undefined) return
    await closeTerminal()
    const generation = ++generationRef.current
    setStatus('opening')
    setError(undefined)
    const terminal = terminalRef.current
    fitRef.current?.fit()
    terminal.writeln('\x1b[38;2;101;209;255mConnecting to local shell…\x1b[0m')
    try {
      const opened = value(await shell.open({
        sessionId, cwd, cols: terminal.cols, rows: terminal.rows,
      }))
      if (generation !== generationRef.current) {
        await shell.close({ sessionId, terminalId: opened.terminalId })
        return
      }
      terminal.reset()
      terminalIdRef.current = opened.terminalId
      setStatus('connected')
      terminal.focus()
      const controller = new AbortController()
      streamRef.current = controller
      try {
        for await (const output of shell.follow({
          sessionId, terminalId: opened.terminalId, cursor: 0,
        }, controller.signal)) {
          if (generation !== generationRef.current) break
          terminal.write(output.data)
        }
        if (!controller.signal.aborted && generation === generationRef.current) setStatus('exited')
      } catch (failure: unknown) {
        if (!controller.signal.aborted && generation === generationRef.current) {
          const message = failure instanceof Error ? failure.message : String(failure)
          setError(message.includes('no sandbox backend') || message.includes('workspace-write')
            ? t('sandboxUnavailable')
            : message)
          setStatus('error')
        }
      }
    } catch (failure: unknown) {
      if (generation === generationRef.current) {
        const message = failure instanceof Error ? failure.message : String(failure)
        setError(message.includes('no sandbox backend') || message.includes('workspace-write')
          ? t('sandboxUnavailable')
          : message)
        setStatus('error')
      }
    }
  }

  if (cwd === undefined) return <div className={css.state}>{t('noCwd')}</div>
  return <div className={css.root}>
    <div className={css.chrome}>
      <div className={css.identity}>
        <IconTerminalOutline16 size={16} />
        <strong>{t('title')}</strong>
        <span className={css.status} data-status={status}>{t(status)}</span>
      </div>
      <code title={cwd}>{cwd}</code>
      <div className={css.actions}>
        <button type="button" className={css.iconAction} onClick={() => { void openTerminal() }} disabled={status === 'opening' || terminalIdRef.current !== undefined} aria-label={t('startTerminal')} title={t('startTerminal')}>
          <IconPlayOutline16 size={15} />
        </button>
        <button type="button" className={css.iconAction} onClick={() => { void openTerminal() }} disabled={status === 'opening' || terminalIdRef.current === undefined} aria-label={t('refreshTerminal')} title={t('refreshTerminal')}>
          <IconRefreshOutline16 size={15} />
        </button>
      </div>
    </div>
    {error === undefined ? null : <div className={css.error} role="alert">{error}</div>}
    <div className={css.terminal} ref={surfaceRef} data-terminal />
    {status === 'idle' ? <button type="button" className={css.launch} onClick={() => { void openTerminal() }}>
      <IconTerminalOutline16 size={26} />
      <span>{t('startTerminal')}</span>
      <kbd>Enter</kbd>
    </button> : null}
  </div>
}
