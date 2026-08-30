/** Host Shell Remote backed by owner-scoped interactive terminal sessions. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-terminal'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { TerminalSessionId } from '@deepseek-ai/dsh-terminal'
import type {
  ShellCloseRequest, ShellCloseValue, ShellFollowRequest, ShellOpenRequest, ShellOpenValue,
  ShellOutputFrame, ShellResizeRequest, ShellResizeValue, ShellWriteRequest, ShellWriteValue,
} from './types.ts'

export type * from './types.ts'

export class ShellController extends TypertRemoteService {
  static inject = ['sessionController', 'terminals']

  constructor(ctx: Context) { super(ctx, 'shellController', { namespace: 'shell' }) }

  private async owner(sessionId: ShellOpenRequest['sessionId']) {
    const found = await this.ctx.sessionController.resolveAgent(sessionId)
    if ('error' in found) throw new Error(found.error.message)
    return found.agent
  }

  @Remote
  async open(request: ShellOpenRequest, signal: AbortSignal): Promise<ShellOpenValue> {
    const owner = await this.owner(request.sessionId)
    const opened = await this.ctx.terminals.spawn(owner, {
      type: 'shell', cwd: request.cwd, profile: 'interactive', cols: request.cols, rows: request.rows,
    }, signal)
    return { terminalId: opened.sessionId }
  }

  @Remote
  async write(request: ShellWriteRequest, signal: AbortSignal): Promise<ShellWriteValue> {
    signal.throwIfAborted()
    const owner = await this.owner(request.sessionId)
    await this.ctx.terminals.write(owner, TerminalSessionId(request.terminalId), request.data)
    return { accepted: true }
  }

  @Remote
  async resize(request: ShellResizeRequest, signal: AbortSignal): Promise<ShellResizeValue> {
    signal.throwIfAborted()
    const owner = await this.owner(request.sessionId)
    await this.ctx.terminals.resize(owner, TerminalSessionId(request.terminalId), request.cols, request.rows)
    return { resized: true }
  }

  @Remote({ mode: 'stream' })
  async *follow(request: ShellFollowRequest, signal: AbortSignal): AsyncIterable<ShellOutputFrame> {
    const owner = await this.owner(request.sessionId)
    yield *this.ctx.terminals.follow(owner, TerminalSessionId(request.terminalId), request.cursor, signal)
  }

  @Remote
  async close(request: ShellCloseRequest, signal: AbortSignal): Promise<ShellCloseValue> {
    signal.throwIfAborted()
    const owner = await this.owner(request.sessionId)
    const closed = await this.ctx.terminals.kill(owner, TerminalSessionId(request.terminalId), 'Shell UI closed')
    return { closed }
  }
}

export default ShellController
