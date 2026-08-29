import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import GitController from '../src/index.ts'

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' })
}

async function fixture(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'dsh-git-'))
  git(cwd, 'init')
  git(cwd, 'config', 'user.name', 'Harness Test')
  git(cwd, 'config', 'user.email', 'test@example.invalid')
  await writeFile(join(cwd, 'one.txt'), 'one\n')
  git(cwd, 'add', 'one.txt')
  git(cwd, 'commit', '-m', 'first')
  await writeFile(join(cwd, 'one.txt'), 'two\n')
  return cwd
}

describe('GitController', () => {
  it('projects repository status and history', async () => {
    const cwd = await fixture()
    const ctx = new Context()
    const controller = new GitController(ctx, { cwd })
    const signal = new AbortController().signal

    const status = await controller.status({}, signal)
    expect(status).toMatchObject({ ahead: 0, behind: 0 })
    expect(status.head).toMatch(/^[0-9a-f]{40}$/)
    expect(status.changes).toEqual([{ status: 'M', path: 'one.txt' }])

    const history = await controller.history({ limit: 1 }, signal)
    expect(history.entries).toHaveLength(1)
    expect(history.entries[0]).toMatchObject({ summary: 'first', author: 'Harness Test' })
  })

  it('returns commit files and a unified commit diff', async () => {
    const cwd = await fixture()
    const commit = git(cwd, 'rev-parse', 'HEAD').trim()
    const ctx = new Context()
    const controller = new GitController(ctx, { cwd })
    const signal = new AbortController().signal

    await expect(controller.commitFiles({ commit }, signal)).resolves.toEqual({
      files: [{ status: 'A', path: 'one.txt' }],
    })
    const value = await controller.diff({ commit }, signal)
    expect(value.diff).toContain('commit ' + commit)
    expect(value.diff).toContain('+one')
  })
})
