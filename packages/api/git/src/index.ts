/** Host Git Remote service over the local Git executable. */

import { execFile as execFileCallback } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {
  GitCommitFilesValue, GitCommitRequest, GitDiffValue, GitFileChange,
  GitHistoryEntry, GitHistoryRequest, GitHistoryValue, GitStatusRequest, GitStatusView,
} from './types.ts'

export type * from './types.ts'

const execFile = promisify(execFileCallback)
const DEFAULT_HISTORY_LIMIT = 30
const MAX_HISTORY_LIMIT = 200

export interface Config { readonly cwd: string }

/** Host service backing the generated `ctx.remote.git` namespace. */
export class GitController extends TypertRemoteService {
  static Config: z<Config> = z.object({ cwd: z.string().default(process.cwd()) })
  private readonly cwd: string

  constructor(ctx: Context, config: Config) {
    super(ctx, 'gitController', { namespace: 'git' })
    this.cwd = resolve(config.cwd)
  }

  private directory(path: string | undefined): string {
    return path === undefined ? this.cwd : resolve(path)
  }

  private async run(path: string | undefined, args: readonly string[], signal: AbortSignal): Promise<string> {
    const result = await execFile('git', ['-C', this.directory(path), ...args], {
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, signal,
    })
    return result.stdout
  }

  @Remote
  async status(request: GitStatusRequest, signal: AbortSignal): Promise<GitStatusView> {
    const branch = (await this.run(request.path, ['branch', '--show-current'], signal)).trim()
    const head = (await this.run(request.path, ['rev-parse', 'HEAD'], signal)).trim()
    const porcelain = await this.run(request.path, ['status', '--porcelain=v1'], signal)
    const changes = porcelain.split('\n').filter(Boolean).map(line => ({
      status: line.slice(0, 2).trim(), path: line.slice(3),
    }))
    let upstream: string | undefined
    let ahead = 0
    let behind = 0
    try {
      upstream = (await this.run(request.path, ['rev-parse', '--abbrev-ref', '@{upstream}'], signal)).trim()
      const counts = (await this.run(request.path, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], signal)).trim()
      const [aheadText, behindText] = counts.split(/\s+/)
      ahead = Number(aheadText ?? 0)
      behind = Number(behindText ?? 0)
    } catch (error) {
      if (signal.aborted) throw error
    }
    return { branch, head, ...(upstream === undefined ? {} : { upstream }), ahead, behind, changes }
  }

  @Remote
  async history(request: GitHistoryRequest, signal: AbortSignal): Promise<GitHistoryValue> {
    const limit = Math.min(MAX_HISTORY_LIMIT, Math.max(1, request.limit ?? DEFAULT_HISTORY_LIMIT))
    const output = await this.run(request.path, ['log', `-${String(limit)}`, '--format=%H%x09%s%x09%an%x09%aI'], signal)
    const entries: GitHistoryEntry[] = output.split('\n').filter(Boolean).map((line) => {
      const [commit = '', summary = '', author = '', date = ''] = line.split('\t')
      return { commit, summary, author, date }
    })
    return { entries }
  }

  @Remote
  async commitFiles(request: GitCommitRequest, signal: AbortSignal): Promise<GitCommitFilesValue> {
    const output = await this.run(request.path, ['diff-tree', '--root', '--no-commit-id', '--name-status', '-r', request.commit], signal)
    const files: GitFileChange[] = output.split('\n').filter(Boolean).map((line) => {
      const [status = '', ...parts] = line.split('\t')
      return { status, path: parts.join('\t') }
    })
    return { files }
  }

  @Remote
  async diff(request: GitCommitRequest, signal: AbortSignal): Promise<GitDiffValue> {
    return { diff: await this.run(request.path, ['show', '--format=fuller', '--no-ext-diff', request.commit], signal) }
  }
}

export default GitController
