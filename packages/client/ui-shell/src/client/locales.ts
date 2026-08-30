export const zh = {
  title: 'Shell', open: '启动终端', restart: '刷新终端', noCwd: '当前会话没有可用的工作目录',
  startTerminal: '启动终端', refreshTerminal: '刷新终端',
  sandboxUnavailable: '当前主机没有可用的 workspace-write 沙箱。请切换到 Full access 后重试。',
  idle: '未连接', opening: '连接中', connected: '已连接', exited: '已退出', error: '错误',
} as const
export const en = {
  title: 'Shell', open: 'Start terminal', restart: 'Refresh terminal', noCwd: 'This session has no working directory',
  startTerminal: 'Start terminal', refreshTerminal: 'Refresh terminal',
  sandboxUnavailable: 'This host has no usable workspace-write sandbox. Switch to Full access and try again.',
  idle: 'Offline', opening: 'Connecting', connected: 'Connected', exited: 'Exited', error: 'Error',
} satisfies Record<keyof typeof zh, string>
export type ShellKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { shellPanel: ShellKey } }
