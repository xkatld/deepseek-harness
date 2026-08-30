// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {} from '../src/client/index.ts'
import type { ShellPanelProps } from '../src/client/ShellPanel.tsx'
import { ShellPanel } from '../src/client/ShellPanel.tsx'
import { en } from '../src/client/locales.ts'

const terminal = vi.hoisted(() => ({
  cols: 80, rows: 24, open: vi.fn(), loadAddon: vi.fn(), onData: vi.fn(() => ({ dispose: vi.fn() })),
  write: vi.fn(), writeln: vi.fn(), reset: vi.fn(), focus: vi.fn(), dispose: vi.fn(),
}))
vi.mock('@xterm/xterm', () => ({
  Terminal: class MockTerminal {
    open = terminal.open
    loadAddon = terminal.loadAddon
    onData = terminal.onData
    write = terminal.write
    writeln = terminal.writeln
    reset = terminal.reset
    focus = terminal.focus
    dispose = terminal.dispose
    cols = terminal.cols
    rows = terminal.rows
  },
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit = vi.fn(); dispose = vi.fn() } }))

class ResizeObserverMock {
  observe(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
const t: ShellPanelProps['t'] = key => en[key as keyof typeof en]
const base = { closeDetails: vi.fn(), useSession: vi.fn(), useSessions: vi.fn(), useWorkspaces: vi.fn(), useProjection: vi.fn(), useSessionPendingInteraction: vi.fn(), useConversation: vi.fn(), useInput: vi.fn(), inputActions: {}, useChat: vi.fn(), useTrajectory: vi.fn() } as unknown as Omit<ShellPanelProps, 'cwd' | 'sessionId' | 'shell' | 't'>

async function *output(): AsyncIterable<{ cursor: number; data: string }> {
  yield { cursor: 1, data: '\x1b[32mready\x1b[0m' }
}

describe('ShellPanel', () => {
  it('opens an interactive terminal and streams raw output', async () => {
    const shell = {
      open: vi.fn().mockResolvedValue({ ok: true, value: { terminalId: 'pty-1' } }),
      write: vi.fn().mockResolvedValue({ ok: true, value: { accepted: true } }),
      resize: vi.fn().mockResolvedValue({ ok: true, value: { resized: true } }),
      follow: vi.fn(() => output()),
      close: vi.fn().mockResolvedValue({ ok: true, value: { closed: true } }),
    }
    render(<ShellPanel {...base} cwd="/repo" sessionId={'session-1' as never} shell={shell as never} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: en.open }))
    await waitFor(() => { expect(shell.open).toHaveBeenCalledWith({ sessionId: 'session-1', cwd: '/repo', cols: 80, rows: 24 }) })
    await waitFor(() => { expect(terminal.write).toHaveBeenCalledWith('\x1b[32mready\x1b[0m') })
    expect(shell.follow).toHaveBeenCalledWith({ sessionId: 'session-1', terminalId: 'pty-1', cursor: 0 }, expect.any(AbortSignal))
  })

  it('does not create a terminal without a working directory', () => {
    const shell = { open: vi.fn(), write: vi.fn(), resize: vi.fn(), follow: vi.fn(), close: vi.fn() }
    render(<ShellPanel {...base} sessionId={'session-1' as never} shell={shell as never} t={t} />)
    expect(screen.getByText(en.noCwd)).toBeTruthy()
    expect(shell.open).not.toHaveBeenCalled()
  })
})
