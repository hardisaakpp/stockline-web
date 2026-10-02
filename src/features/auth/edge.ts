/**
 * Entry point for `src/proxy.ts`. Kept apart from `server.ts` because the proxy bundle must not
 * pull in `server-only` modules (they rely on the React Server Components build conditions).
 */
export { authProxy } from "./auth-proxy";
