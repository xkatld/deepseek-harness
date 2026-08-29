/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-host-web-auth`.
 * @module @deepseek-ai/dsh-host-web-auth/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-host-web-auth'

/** Cordis companion plugin name. */
export const name = 'host-web-auth-invariant'
/** Service required before the companion can register. */
export const inject = ['invariants']

/**
 * No runtime invariant: the sole effect is one boot-time gate registration
 * owned by the plugin fiber; the webserver gate table is authoritative and
 * its disposer symmetry is covered by the package's real-composition test.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
