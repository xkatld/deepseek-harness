import { Fragment } from 'react'
import { CodeBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import { shallowEqual } from '@deepseek-ai/dsh-client-store'
import type { DetailsSlotProps, DetailsTabProps } from '../contract/slots.ts'
import type { ChatSnapshot, RunningToolCall, ToolCallBlock, ToolResultNode } from '../contract/snapshot.ts'
import { findToolCall } from './tool-node-reader.ts'
import css from './DetailsPanel.module.css'

/** Tool content contribution rendered by the right-sidebar shell. */
export type DetailsPanelProps = DetailsSlotProps

interface CallMaterial {
  name: string
  argsRaw: string | null
  block: ToolCallBlock
}

function settledMaterial(node: ToolResultNode, callId: string): CallMaterial {
  return { name: node.call?.name ?? callId, argsRaw: node.call?.argsRaw ?? null, block: node }
}
function runningMaterial(call: RunningToolCall): CallMaterial {
  return { name: call.name, argsRaw: call.argsRaw, block: call }
}
function materialFor(s: ChatSnapshot, callId: string): CallMaterial | null {
  const found = findToolCall(s, callId)
  if (found === undefined) return null
  return 'kind' in found ? settledMaterial(found, callId) : runningMaterial(found)
}
function pretty(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
}
function rawResultText(block: ToolCallBlock): string {
  if (!('kind' in block)) return ''
  const parts = block.content.map(item => item.type === 'text' ? item.text : JSON.stringify(item, null, 2))
  if (parts.length === 0 && block.error !== undefined) parts.push(`${block.error.name}: ${block.error.code}`)
  return parts.join('\n')
}

/** Render the Tool tab contributed by Chat. */
export function ToolDetailsTab({ useStore, activeId, activate, t }: DetailsTabProps) {
  const selection = useStore(state => state.selection)
  return (
    <button type="button" className={css.tab} role="tab" aria-selected={activeId === 'tool'} onClick={() => { activate('tool') }}>
      {selection?.toolName ?? t('details.toolTab')}
    </button>
  )
}

/** Render only Tool-call details; the independent right-sidebar plugin owns the chrome. */
export function DetailsPanel({ useChat, useStore, renderSlot, cwd, t }: DetailsPanelProps) {
  const selection = useStore(state => state.selection)
  const callId = selection?.callId
  const material = useChat(
    state => (callId === undefined ? null : materialFor(state, callId)),
    (a, b) => shallowEqual(a, b))
  if (selection === null || callId === undefined) return <div className={css.empty}>{t('details.empty')}</div>
  if (material === null) return <div className={css.empty}>{t('details.notInWindow')}</div>
  const running = !('kind' in material.block)
  const failed = !running && 'isError' in material.block && material.block.isError
  const status = running ? t('details.running') : failed ? t('command.failed') : t('command.done')
  return (
    <div className={css.panel}>
      <header className={css.header}>
        <div>
          <div className={css.eyebrow}>{t('details.title')}</div>
          <div className={css.toolName}>{material.name}</div>
        </div>
        <span className={failed ? css.badgeError : running ? css.badgeRunning : css.badgeDone}>{status}</span>
      </header>
      {material.argsRaw !== null && (
        <section className={css.section}>
          <div className={css.sectionLabel}>{t('details.input')}</div>
          <CodeBlock code={pretty(material.argsRaw)} lang="json" copyLabel={t('copy')} copiedLabel={t('copied')} />
        </section>
      )}
      <section className={css.section}>
        <div className={css.sectionLabel}>{t('details.output')}</div>
        <Fragment key={callId}>
          {renderSlot('conversation.details.tool', { block: material.block, cwd }, {
            fallback: 'kind' in material.block
              ? <pre className={css.code} data-error={material.block.isError || undefined}>{rawResultText(material.block)}</pre>
              : <div className={css.empty}>{t('details.running')}</div>,
          })}
        </Fragment>
      </section>
    </div>
  )
}
