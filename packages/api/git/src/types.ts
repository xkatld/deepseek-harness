/** Browser-safe request and result vocabulary for the Git Remote. */

export interface GitStatusRequest { readonly path?: string }
export interface GitStatusEntry { readonly path: string; readonly status: string }
export interface GitStatusView {
  readonly branch: string
  readonly head?: string
  readonly upstream?: string
  readonly ahead: number
  readonly behind: number
  readonly changes: readonly GitStatusEntry[]
}
export interface GitHistoryRequest { readonly path?: string; readonly limit?: number }
export interface GitHistoryEntry {
  readonly commit: string
  readonly summary: string
  readonly author: string
  readonly date: string
}
export interface GitHistoryValue { readonly entries: readonly GitHistoryEntry[] }
export interface GitCommitRequest { readonly path?: string; readonly commit: string }
export interface GitFileChange { readonly path: string; readonly status: string }
export interface GitCommitFilesValue { readonly files: readonly GitFileChange[] }
export interface GitDiffValue { readonly diff: string }
