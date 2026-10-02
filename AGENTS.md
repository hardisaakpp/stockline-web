<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Stockline Web — project conventions

Next.js (App Router) front end for **api-stockline** (.NET). UI language: English. Never reference any
real company, product or system name in code, copy, data or docs: the domain is generic
(Buyer / Supplier / SupplierProduction).

## Commands

- `npm run dev` — dev server (port 3000), needs api-stockline at `STOCKLINE_API_URL`
- `npm run verify` — typecheck + lint + format check + unit tests (run before declaring a change done)
- `npm run test:e2e` — Playwright against a real, seeded api-stockline (port 3100)
- `npm run test:coverage` — unit tests with coverage
- `npm run dev:directory` + `STOCKLINE_DIRECTORY=1 npm run dev:api` — directory sign-in against a real Samba AD (browser tests opt-in with `E2E_DIRECTORY=1`)
- `npm run dev:xia` — the assistant engine (needs `xia-db-1` running); browser tests for it are opt-in with `E2E_XIA=1`

## Architecture

- `src/app` — routes only: thin pages that compose feature components. Route groups: `(auth)` public, `(app)` signed-in shell.
- `src/features/<name>` — one folder per domain feature. Public API is `index.ts` (isomorphic), `server.ts`
  (server-only: data access, actions) and `edge.ts` (proxy). **Other code imports only those entry points**
  (enforced by ESLint `no-restricted-imports`). Inside a feature use relative imports.
- `src/components/ui` — shadcn/ui primitives (Base UI). Generated: edit sparingly. `src/components/layout`, `feedback`, `brand` — shared building blocks.
- `src/lib` — framework-agnostic utilities (`format`, `locale`, `api` client, `actions` result/runner/error messages, `env`).
- Links that look like buttons use `ButtonLink`/`ButtonAnchor` (never `<Button render={<Link/>}>`: it adds `role="button"`).
- `src/features/assistant` — Xia, the assistant. The server signs a short-lived JWT (identity + permissions) and runs the
  agent loop (`agent.ts`): Xia proposes tools, `tools/executors.ts` runs them read-only with the user's own session. New tool →
  definition in `tools/definitions.ts` (gated by permission), a Zod-validated executor that returns structured fields only
  (never free text written by others), a test, and a line in `assistant/knowledge`. Tools must never change anything. `assistant/knowledge/*.md` is its only source and `assistant/sources.yaml` maps each
  document to the permission that unlocks it. New feature or changed behaviour → update the matching document there and
  re-index (`npm run dev:xia -- index`). Never put anything in the knowledge base that a role should not read.
- Sign-in has two providers (`local`, `directory`, see `features/auth/login-form-schema.ts`). The web app never talks to the
  directory: it sends the provider to the API and maps the answer (`login-errors.ts`). In e2e, sign in through
  `e2e/helpers/sign-in.ts` so tests work whether or not the switch is shown.
- `src/proxy.ts` — Next 16 `proxy` (the old `middleware`): auth gate + the single place a session is renewed.

## Rules (all enforced by lint unless noted)

1. **No `any`**, no floating promises, `eqeqeq`, files ≤ 300 lines, function complexity ≤ 12 (warn).
2. **Never hardcode a locale.** Dates/numbers go through `@/lib/format` (locale lives in `@/lib/locale`).
3. **Tokens never reach the browser.** Session lives in HttpOnly cookies; server code reads them via
   `@/features/auth/server`; browser code calls `/api/bff/*`. No `localStorage` for auth.
4. **Validate every API response with Zod** (`apiRequest(path, schema)`); derive types with `z.infer`.
5. **Permissions follow `module.action`** (`orders.view`). Guard pages with `requirePermission()` in the data
   access layer, gate UI with `can()`. The API remains the authority.
6. Dark mode and keyboard accessibility are required for every component. Prefer Server Components; add
   `"use client"` only for interactivity.
7. **User-visible text lives in the message catalogs** (`src/messages/{en,es}/*.json`), one file per module, always in BOTH languages (a test enforces the same keys and placeholders). Mutations return `ActionResult` (`@/lib/actions`): failures are codes the UI translates, never raw API text.
8. Reuse before copy: look in `src/components` and the feature before writing a new component (not enforced).
9. Tests live next to the code (`*.test.ts[x]`); server-side tests use `// @vitest-environment node`.
   Don't use `vi.fn()` for a function that returns a rejected promise (the spy reports it as unhandled).
