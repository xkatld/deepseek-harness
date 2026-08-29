/**
 * The session-log record of the model selection one session actually runs.
 *
 * A session's selection is otherwise reconstructable only from the request
 * header its last dispatched step wrote, so a switch made before the next turn
 * starts would not survive a restart and would silently fall back to the
 * deployment default. Recording the choice keeps each conversation on its own
 * model across process lifetimes, independently of every other conversation.
 *
 * Reconstruction reads {@link resolveSessionModelSelection} before the logged
 * request header, so the newest explicit choice wins over the route the last
 * dispatched step happened to use.
 * @module @deepseek-ai/dsh-agent-default-model/session
 */

import type { ModelSelection } from '@deepseek-ai/dsh-agent'
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm'
import type { SessionEvent } from '@deepseek-ai/dsh-session'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /**
     * The session's model selection was chosen by its user. Log-only: it
     * records the route later steps run under, so a resumed session restores
     * the same selection instead of the deployment default, and a selection
     * made without sending a message is not lost.
     */
    'model/selected': { provider: string; model: string; reasoningEffort?: string }
  }
}

/** The minimum a caller must supply to resolve a session's model selection. */
export interface ModelBearingSession {
  /** The session's event log, oldest first. */
  readonly events: readonly SessionEvent[]
}

/**
 * The model selection a session was last explicitly pointed at, newest winning.
 *
 * @param session - the session's event log.
 * @returns the selection, or `undefined` when the session logged none.
 */
export function resolveSessionModelSelection(session: ModelBearingSession): ModelSelection | undefined {
  const chosen = session.events.findLast(event => event.type === 'model/selected')
  if (chosen === undefined) return undefined
  const { provider, model, reasoningEffort } = chosen.data
  return {
    provider,
    model,
    ...reasoningEffort === undefined ? {} : { reasoningEffort: ReasoningEffortId(reasoningEffort) },
  }
}
