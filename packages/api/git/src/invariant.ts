/** Package-owned invariant companion. @module @deepseek-ai/dsh-api-git/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'api-git-invariant'
export const inject = ['invariants']
/** No runtime invariant: the service projects stateless Git subprocess reads. */
const install: InvariantInstaller = () => {}
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-api-git', install))
