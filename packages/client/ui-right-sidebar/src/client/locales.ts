/** Simplified Chinese right-sidebar shell dictionary. */
export const zh = {
  title: '右侧边栏', tabs: '右侧边栏面板', open: '打开右侧边栏', close: '关闭右侧边栏', empty: '选择一个面板', unavailable: '此面板不可用',
} satisfies Record<string, string>
/** Right-sidebar locale key union. */
export type RightSidebarKey = keyof typeof zh
/** English right-sidebar shell dictionary. */
export const en = {
  title: 'Right sidebar', tabs: 'Right sidebar panels', open: 'Open right sidebar', close: 'Close right sidebar', empty: 'Select a panel', unavailable: 'This panel is unavailable',
} satisfies Record<RightSidebarKey, string>
