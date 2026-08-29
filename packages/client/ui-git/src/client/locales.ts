/** Simplified Chinese Git panel dictionary. */
export const zh = {
  title: 'Git', repository: '仓库', listTab: 'Git 列表', detailTab: '提交详情', backToList: '返回列表', currentWorkspace: '当前工作区', refresh: '刷新', loading: '加载中…', unavailable: '当前目录不是 Git 仓库', history: '提交记录', head: 'HEAD', sync: '同步状态', workingTree: '工作区', clean: '干净', changed: '有变更', changeCount: '{count} 项变更', filesChanged: '{count} 个文件', emptyHistory: '暂无提交记录', emptyChanges: '工作区干净', emptyDetail: '选择一条提交查看详情', emptyDiff: '此提交没有可显示的差异',
} satisfies Record<string, string>
/** Git panel locale key union. */
export type GitKey = keyof typeof zh
/** English Git panel dictionary. */
export const en = {
  title: 'Git', repository: 'Repository', listTab: 'Git list', detailTab: 'Commit details', backToList: 'Back to list', currentWorkspace: 'Current workspace', refresh: 'Refresh', loading: 'Loading…', unavailable: 'The current directory is not a Git repository', history: 'Commits', head: 'HEAD', sync: 'Sync', workingTree: 'Working tree', clean: 'Clean', changed: 'Changed', changeCount: '{count} changes', filesChanged: '{count} files', emptyHistory: 'No commits', emptyChanges: 'Working tree clean', emptyDetail: 'Select a commit to view details', emptyDiff: 'No diff is available for this commit',
} satisfies Record<GitKey, string>
