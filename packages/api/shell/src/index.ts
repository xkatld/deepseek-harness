/** Host Shell Remote backed by owner-scoped terminal sessions. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-terminal'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { TerminalSessionId } from '@deepseek-ai/dsh-terminal'
import type {
  ShellCloseRequest, ShellCloseValue, ShellOpenRequest, ShellOpenValue,
  ShellReadRequest, ShellReadValue, ShellSendRequest, ShellSendValue,
} from './types.ts'

export type * from './types.ts'

export class ShellController extends TypertRemoteService {
  static inject = ['sessionController', 'terminals']

  constructor(ctx: Context) { super(ctx, 'shellController', { namespace: 'shell' }) }

  private async owner(sessionId: ShellOpenRequest['sessionId']) {
    const found = await this.ctx.sessionController.resolveAgent(sessionId)
    if ('error' in found) throw found.error
    return found.agent
  }

  @Remote
  async open(request: ShellOpenRequest, signal: AbortSignal): Promise<ShellOpenValue> {
    const owner = await this.owner(request.sessionId)
    const opened = await this.ctx.terminals.spawn(owner, { type: 'shell', cwd: request.cwd }, signal)
    return { terminalId: opened.sessionId, output: opened.motd }
  }

  @Remote
  async send(request: ShellSendRequest, signal: AbortSignal): Promise<ShellSendValue> {
    const owner = await this.owner(request.sessionId)
    const operation = this.ctx.terminals.startSend(owner, TerminalSessionId(request.terminalId), {
      text: request.text, submit: true, signal,
    })
    const result = await operation.done
    return { output: result.viewport, running: result.sessionStatus.kind === 'running' }
  }

  @Remote
  async read(request: ShellReadRequest, signal: AbortSignal): Promise<ShellReadValue> {
    signal.throwIfAborted()
    const owner = await this.owner(request.sessionId)
    const id = TerminalSessionId(request.terminalId)
    const output = this.ctx.terminals.read(owner, id, { offset: 0, count: 500 }).text
    const status = this.ctx.terminals.list(owner).find(item => item.sessionId === id)?.status
    return { output, running: status?.kind === 'running' }
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
