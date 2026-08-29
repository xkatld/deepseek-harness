import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

/** Cordis companion plugin name. */
export const name = 'ui-right-sidebar-invariant'
/** Service required for package invariant registration. */
export const inject = ['invariants']
/** No runtime invariant: the slot registry owns contribution lifetime. */
const install: InvariantInstaller = () => {}
/** Register the package invariant companion. */
export const apply = (ctx: Context): Promise<() => void> => Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-client-ui-right-sidebar', install))
