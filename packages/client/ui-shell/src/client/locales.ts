export const zh = {
  title: 'Local Shell', open: '打开终端', restart: '重启', noCwd: '当前会话没有可用的工作目录',
  idle: '未连接', opening: '连接中', connected: '已连接', exited: '已退出', error: '错误',
} as const
export const en = {
  title: 'Local Shell', open: 'Open terminal', restart: 'Restart', noCwd: 'This session has no working directory',
  idle: 'Offline', opening: 'Connecting', connected: 'Connected', exited: 'Exited', error: 'Error',
} satisfies Record<keyof typeof zh, string>
export type ShellKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { shellPanel: ShellKey } }
