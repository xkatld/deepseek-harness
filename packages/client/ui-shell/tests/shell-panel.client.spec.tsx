// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from '../src/client/index.ts'
import type { ShellPanelProps } from '../src/client/ShellPanel.tsx'
import { ShellPanel } from '../src/client/ShellPanel.tsx'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)
const t: ShellPanelProps['t'] = key => en[key as keyof typeof en]
const base = { closeDetails: vi.fn(), useSession: vi.fn(), useSessions: vi.fn(), useWorkspaces: vi.fn(), useProjection: vi.fn(), useSessionPendingInteraction: vi.fn(), useConversation: vi.fn(), useInput: vi.fn(), inputActions: {}, useChat: vi.fn(), useTrajectory: vi.fn() } as unknown as Omit<ShellPanelProps, 'cwd' | 'sessionId' | 'shell' | 't'>

describe('ShellPanel', () => {
  it('opens a PTY with the current session cwd and sends commands', async () => {
    const shell = { open: vi.fn().mockResolvedValue({ ok: true, value: { terminalId: 'pty-1', output: 'bash\n' } }), send: vi.fn().mockResolvedValue({ ok: true, value: { output: 'bash\n$ pwd\n/repo\n', running: true } }) }
    render(<ShellPanel {...base} cwd="/repo" sessionId={'session-1' as never} shell={shell as never} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: en.open }))
    await screen.findByRole('textbox', { name: en.command })
    expect(await shell.open).toHaveBeenCalledWith({ sessionId: 'session-1', cwd: '/repo' })
    fireEvent.change(screen.getByRole('textbox', { name: en.command }), { target: { value: 'pwd' } })
    fireEvent.click(screen.getByRole('button', { name: en.run }))
    expect(await shell.send).toHaveBeenCalledWith({ sessionId: 'session-1', terminalId: 'pty-1', text: 'pwd' })
    expect(await screen.findByText('/repo')).toBeTruthy()
  })

  it('does not create a terminal without a working directory', () => {
    const shell = { open: vi.fn(), send: vi.fn() }
    render(<ShellPanel {...base} sessionId={'session-1' as never} shell={shell as never} t={t} />)
    expect(screen.getByText(en.noCwd)).toBeTruthy()
    expect(shell.open).not.toHaveBeenCalled()
  })
})
