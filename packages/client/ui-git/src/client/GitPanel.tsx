import { useEffect, useState } from 'react'
import { IconBranchOutline16, IconChevronLeftOutline14, IconRefreshOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { GitCommitFilesValue, GitDiffValue, GitHistoryEntry, GitHistoryValue, GitStatusView } from '@deepseek-ai/dsh-api-git/types'
import type { RightSidebarContentOwnerProps } from '@deepseek-ai/dsh-client-ui-right-sidebar/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { GitKey } from './locales.ts'
import css from './GitPanel.module.css'

export interface GitPanelInjected {
  status(path?: string): Promise<GitStatusView>
  history(path?: string): Promise<GitHistoryValue>
  commitFiles(path: string | undefined, commit: string): Promise<GitCommitFilesValue>
  diff(path: string | undefined, commit: string): Promise<GitDiffValue>
}
export type GitPanelProps = PropsRuntime<'right-sidebar.content'> & RightSidebarContentOwnerProps & PropsLocale<'gitPanel'> & InjectFace<GitPanelInjected>
interface Detail { commit: string; files: GitCommitFilesValue['files']; diff: string }

function shortCommit(commit: string | undefined): string { return commit === undefined ? '—' : commit.slice(0, 8) }
function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

export function GitPanel({ cwd, status: loadStatus, history: loadHistory, commitFiles, diff, t }: GitPanelProps) {
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState<GitStatusView | null>(null)
  const [history, setHistory] = useState<readonly GitHistoryEntry[]>([])
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState(true)
  const refresh = async (): Promise<void> => {
    setLoading(true)
    try {
      const [nextStatus, nextHistory] = await Promise.all([loadStatus(cwd), loadHistory(cwd)])
      setStatus(nextStatus); setHistory(nextHistory.entries); setAvailable(true)
    } catch { setAvailable(false) } finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [cwd])
  useEffect(() => {
    if (selected === null) { setDetail(null); return }
    let active = true
    void Promise.all([commitFiles(cwd, selected), diff(cwd, selected)]).then(([files, content]) => {
      if (active) setDetail({ commit: selected, files: files.files, diff: content.diff })
    }).catch(() => { if (active) setDetail(null) })
    return () => { active = false }
  }, [commitFiles, cwd, diff, selected])
  return <div className={css.root}>
    <div className={css.toolbar}>
      <div><div className={css.heading}>{t('repository')}</div><div className={css.path}>{cwd ?? t('currentWorkspace')}</div></div>
      <div className={css.toolbarActions}>
        {view === 'detail' && <button className={css.iconButton} type="button" aria-label={t('backToList')} title={t('backToList')} onClick={() => { setView('list') }}><IconChevronLeftOutline14 size={16} /></button>}
        <button className={css.iconButton} type="button" aria-label={t('refresh')} onClick={() => { void refresh() }} disabled={loading}><IconRefreshOutline16 size={16} className={loading ? css.spinning : undefined} /></button>
      </div>
    </div>
    <div className={css.viewTabs} role="tablist" aria-label={t('title')}><button type="button" role="tab" aria-selected={view === 'list'} onClick={() => { setView('list') }}>{t('listTab')}</button><button type="button" role="tab" aria-selected={view === 'detail'} onClick={() => { setView('detail') }}>{t('detailTab')}</button></div>
    {view === 'list' ? <div className={css.scroll} role="tabpanel">
      {loading && status === null && <div className={css.state}>{t('loading')}</div>}{!available && <div className={css.state}>{t('unavailable')}</div>}
      {available && status !== null && <Status status={status} t={t} />}
      {available && status !== null && <section className={css.section}><div className={css.sectionHeader}><span>{t('history')}</span><span className={css.count}>{history.length}</span></div>{history.length === 0 ? <div className={css.state}>{t('emptyHistory')}</div> : <div className={css.history}>{history.map(entry => <button key={entry.commit} type="button" className={css.commit} aria-pressed={entry.commit === selected} onClick={() => { setSelected(entry.commit); setView('detail') }}><span className={css.commitRail}><span className={css.commitLine} /><span className={css.commitDot} /></span><span className={css.commitContent}><span className={css.commitSummary}>{entry.summary}</span><span className={css.commitMeta}><span>{entry.author}</span><span>{formatDate(entry.date)}</span><code>{shortCommit(entry.commit)}</code></span></span></button>)}</div>}</section>}
    </div> : <div className={css.scroll} role="tabpanel">{detail === null ? <div className={css.state}>{t('emptyDetail')}</div> : <DetailView detail={detail} t={t} />}</div>}
  </div>
}

function Status({ status, t }: { status: GitStatusView; t: (key: GitKey, params?: Record<string, unknown>) => string }) {
  const clean = status.changes.length === 0
  return <section className={css.summary}><div className={css.branchRow}><IconBranchOutline16 size={15} /><strong>{status.branch}</strong><span className={css.badge}>{clean ? t('clean') : t('changed')}</span></div><div className={css.metaGrid}><div><span>{t('head')}</span><code>{shortCommit(status.head)}</code></div><div><span>{t('sync')}</span><strong>{`↑ ${status.ahead}  ↓ ${status.behind}`}</strong></div><div><span>{t('workingTree')}</span><strong>{clean ? t('emptyChanges') : t('changeCount', { count: status.changes.length })}</strong></div></div></section>
}
function DetailView({ detail, t }: { detail: Detail; t: (key: GitKey, params?: Record<string, unknown>) => string }) {
  return <section className={css.detailSection}><div className={css.detail}><div className={css.detailCommit}><code>{shortCommit(detail.commit)}</code><span>{t('filesChanged', { count: detail.files.length })}</span></div><div className={css.files}>{detail.files.map(file => <div key={`${file.status}:${file.path}`} className={css.file}><span data-status={file.status}>{file.status}</span><span title={file.path}>{file.path}</span></div>)}</div>{detail.diff === '' ? <div className={css.state}>{t('emptyDiff')}</div> : <pre className={css.diff}>{detail.diff}</pre>}</div></section>
}
