/**
 * Git UI plugin, node half. Pure UI plugin: the empty apply exists so the
 * package loads through cordis and exposes the browser half via exports["./client"].
 */

/** Host plugin body — no host-side behavior for the Git panel plugin. */
export function apply(): void {}
