// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from '../src/client/index.ts'
import { GitPanel, type GitPanelProps } from '../src/client/GitPanel.tsx'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t: GitPanelProps['t'] = (key, params) => {
  let value: string = key in en ? en[key as keyof typeof en] : key
  for (const [name, replacement] of Object.entries(params ?? {})) {
    value = value.replace(`{${name}}`, String(replacement))
  }
  return value
}

describe('GitPanel', () => {
  it('renders repository status, history, files, and diff', async () => {
    const status = vi.fn().mockResolvedValue({
      branch: 'master', head: '1234567890abcdef', upstream: 'origin/master', ahead: 1, behind: 2,
      changes: [{ status: 'M', path: 'src/index.ts' }],
    })
    const history = vi.fn().mockResolvedValue({
      entries: [{ commit: 'abcdef1234567890', summary: 'Fix panel', author: 'Alice', date: '2026-08-29T12:00:00.000Z' }],
    })
    const commitFiles = vi.fn().mockResolvedValue({ files: [{ status: 'M', path: 'src/index.ts' }] })
    const diff = vi.fn().mockResolvedValue({ diff: 'diff --git a/src/index.ts b/src/index.ts' })

    render(<GitPanel
      cwd="/repo"
      status={status}
      history={history}
      commitFiles={commitFiles}
      diff={diff}
      closeDetails={vi.fn()}
      t={t}
      sessionId={'session-1' as never}
      useSession={vi.fn() as never}
      useSessions={vi.fn() as never}
      useWorkspaces={vi.fn() as never}
      useProjection={vi.fn() as never}
      useSessionPendingInteraction={vi.fn() as never}
      useConversation={vi.fn() as never}
      useInput={vi.fn() as never}
      inputActions={{} as never}
      useChat={vi.fn() as never}
      useTrajectory={vi.fn() as never}
    />)

    expect(await screen.findByText('master')).toBeTruthy()
    expect(screen.getByText('Fix panel')).toBeTruthy()
    expect(status).toHaveBeenCalledWith('/repo')
    expect(history).toHaveBeenCalledWith('/repo')

    fireEvent.click(screen.getByRole('button', { name: /Fix panel/ }))
    expect(await screen.findByText('src/index.ts')).toBeTruthy()
    expect(screen.getByText('diff --git a/src/index.ts b/src/index.ts')).toBeTruthy()
    await waitFor(() => {
      expect(commitFiles).toHaveBeenCalledWith('/repo', 'abcdef1234567890')
      expect(diff).toHaveBeenCalledWith('/repo', 'abcdef1234567890')
    })
  })

  it('shows the unavailable state when repository reads fail', async () => {
    render(<GitPanel
      status={() => Promise.reject(new Error('not a repository'))}
      history={() => Promise.reject(new Error('not a repository'))}
      commitFiles={vi.fn()}
      diff={vi.fn()}
      closeDetails={vi.fn()}
      t={t}
      sessionId={'session-1' as never}
      useSession={vi.fn() as never}
      useSessions={vi.fn() as never}
      useWorkspaces={vi.fn() as never}
      useProjection={vi.fn() as never}
      useSessionPendingInteraction={vi.fn() as never}
      useConversation={vi.fn() as never}
      useInput={vi.fn() as never}
      inputActions={{} as never}
      useChat={vi.fn() as never}
      useTrajectory={vi.fn() as never}
    />)

    expect(await screen.findByText(en.unavailable)).toBeTruthy()
  })
})
