# Web auth re-adaptation

- Re-adapt the user-auth feature set onto the current `packages/host/webserver` architecture instead of restoring an older package layout.
- Keep the authentication gate aligned with the current webserver route/fallback model and preserve the user-specific behavior for public mode, username/password login, and UUID generation outside secure contexts.
- Verify the shipped `packages/host/web-auth` package and its tests against the current host stack, then run focused checks for the touched host packages.
