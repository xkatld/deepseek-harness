import type { SessionId } from '@deepseek-ai/dsh-session/types'

export interface ShellOpenRequest {
  readonly sessionId: SessionId
  readonly cwd: string
  readonly cols: number
  readonly rows: number
}
export interface ShellOpenValue { readonly terminalId: string }
export interface ShellWriteRequest { readonly sessionId: SessionId; readonly terminalId: string; readonly data: string }
export interface ShellWriteValue { readonly accepted: true }
export interface ShellResizeRequest {
  readonly sessionId: SessionId
  readonly terminalId: string
  readonly cols: number
  readonly rows: number
}
export interface ShellResizeValue { readonly resized: true }
export interface ShellFollowRequest { readonly sessionId: SessionId; readonly terminalId: string; readonly cursor: number }
export interface ShellOutputFrame { readonly cursor: number; readonly data: string }
export interface ShellCloseRequest { readonly sessionId: SessionId; readonly terminalId: string }
export interface ShellCloseValue { readonly closed: boolean }
