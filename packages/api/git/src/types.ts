/** Browser-safe request and result types for the Git Remote. */

/** Repository status request. */
export interface GitStatusRequest { readonly path?: string }
/** One working-tree entry from porcelain status. */
export interface GitStatusEntry { readonly path: string; readonly status: string }
/** Repository status with branch, synchronization, and working-tree facts. */
export interface GitStatusView {
  readonly branch: string
  readonly head?: string
  readonly upstream?: string
  readonly ahead: number
  readonly behind: number
  readonly changes: readonly GitStatusEntry[]
}
/** Bounded commit history request. */
export interface GitHistoryRequest { readonly path?: string; readonly limit?: number }
/** One commit history entry. */
export interface GitHistoryEntry {
  readonly commit: string
  readonly summary: string
  readonly author: string
  readonly date: string
}
/** Bounded commit history result. */
export interface GitHistoryValue { readonly entries: readonly GitHistoryEntry[] }
/** Request addressing one commit. */
export interface GitCommitRequest { readonly path?: string; readonly commit: string }
/** One file changed by a commit. */
export interface GitFileChange { readonly path: string; readonly status: string }
/** Files changed by one commit. */
export interface GitCommitFilesValue { readonly files: readonly GitFileChange[] }
/** Commit diff result. */
export interface GitDiffValue { readonly diff: string }
