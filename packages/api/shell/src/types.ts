import type { SessionId } from '@deepseek-ai/dsh-session/types'

export interface ShellOpenRequest { readonly sessionId: SessionId; readonly cwd: string }
export interface ShellOpenValue { readonly terminalId: string; readonly output: string }
export interface ShellSendRequest { readonly sessionId: SessionId; readonly terminalId: string; readonly text: string }
export interface ShellSendValue { readonly output: string; readonly running: boolean }
export interface ShellReadRequest { readonly sessionId: SessionId; readonly terminalId: string }
export interface ShellReadValue { readonly output: string; readonly running: boolean }
export interface ShellCloseRequest { readonly sessionId: SessionId; readonly terminalId: string }
export interface ShellCloseValue { readonly closed: boolean }
