export const zh = { title: 'Shell', open: '打开终端', restart: '重启', command: '命令', run: '执行', noCwd: '当前会话没有可用的工作目录' } as const
export const en = { title: 'Shell', open: 'Open terminal', restart: 'Restart', command: 'Command', run: 'Run', noCwd: 'This session has no working directory' } satisfies Record<keyof typeof zh, string>
export type ShellKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { shellPanel: ShellKey } }
