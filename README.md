# Stockline Web

Web client for **Stockline**, a purchase-order management system. Buyers import an order from a spreadsheet, suppliers confirm quantities and costs, the buyer redistributes stock across stores, and the order is pushed to the ERP — with every status change tracked and streamed live.

> Companion to [`api-stockline`](../api-stockline) (.NET 10). Both are portfolio projects with fictitious data.

## What it does

- **Orders**: import an order from a spreadsheet (dry-run check first), then follow it from draft to delivery. Buyers, suppliers and supplier production each see and do only what their role allows: edit confirmed quantities, resolve the production shortfall (skip it or split it into child orders), redistribute stock across locations (with a proportional proposal and saved drafts), send to the ERP and retry. Pages update live through a server-sent event stream.
- **Dashboard**: what is waiting for you, open orders, ERP failures, a 30-day volume chart and the status breakdown.
- **Administration**: users (create, edit, reset password, last-administrator protection), a read-only roles and permissions matrix, locations, and email notification subscriptions with a sandboxed preview.
- **Xia, the assistant**: a side panel that answers how Stockline works from its own documentation, cites the documents it used, remembers the conversation, speaks the interface language and only draws on documents the person's permissions allow. See [The assistant](#the-assistant-xia).
- **English and Spanish**, switchable at any time; dates follow the language, numbers always read `1,234.56`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Base UI) · TanStack Query · React Hook Form + Zod · Vitest + Testing Library · Playwright.

## Getting started

```bash
nvm use                 # Node 24
npm install
cp .env.example .env.local   # point STOCKLINE_API_URL at api-stockline
npm run dev
```

Demo accounts (seeded by api-stockline in Development): `admin@`, `buyer@`, `supplier@`, `production@stockline.test` — password `Demo-Pass-2026!`. For directory sign-in see [Signing in](#signing-in).

| Command                   | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `npm run dev`             | Dev server on port 3000                                        |
| `npm run verify`          | Typecheck + lint + format check + unit tests (what CI runs)    |
| `npm run test:coverage`   | Unit tests with coverage                                       |
| `npm run test:e2e`        | Playwright against a running, seeded api-stockline (port 3100) |
| `npm run dev:api`         | Starts api-stockline for local development (see the script)    |
| `npm run dev:directory`   | Starts the development Active Directory (Samba) and seeds it   |
| `npm run dev:xia`         | Starts Xia (the assistant engine) with the Stockline knowledge |
| `npm run sample:template` | Rebuilds the sample order spreadsheet in `public/samples`      |

## Architecture

```
src/
  app/            Routes only — (auth) public, (app) signed-in shell, api/bff passthrough
  features/       One folder per domain feature, entered through index.ts / server.ts / edge.ts
  components/     ui (shadcn), layout, feedback, brand
  lib/            format, locale, env, typed API client
  proxy.ts        Auth gate + the single place a session is renewed
```

### Security model (Backend-for-Frontend)

- The browser **never holds an API token.** Login happens in a Server Action; the access and refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies (`Secure` in production).
- `proxy.ts` renews an expired access token before the page renders, sharing one refresh call between concurrent requests (the API rotates refresh tokens and treats reuse as theft).
- Server code reads the session through a data access layer (`@/features/auth/server`); a disabled account or changed role takes effect on the next request.
- Browser code (live updates, client-side queries) goes through `/api/bff/*`, which attaches the token and rejects cross-origin writes.
- Every API response is validated with Zod at the boundary, so a contract drift fails loudly instead of rendering `undefined`.

### Conventions

Enforced by ESLint: no `any`, no floating promises, import boundaries between features, files ≤ 300 lines, and **no hardcoded locales** (dates/numbers go through `@/lib/format`). See [`AGENTS.md`](AGENTS.md) for the full list.

## Signing in

Two ways in, chosen on the sign-in page (the choice only appears when the API offers the directory):

- **Directory account** — the organisation's Active Directory (or any LDAP server with its schema). The person types their username (or email), the API proves the password against the directory, and **directory groups decide the role**; the same tokens come out as for a local account. Someone the directory knows but no group admits is told so, and one who is simply wrong gets the same answer as an unknown user.
- **Local account** — email and password stored by the API, for administrators and demos.

The web app does none of the directory work: it sends `provider: "directory"` and shows what the API answers. Directory accounts appear in **Administration → Users** with a badge; their name, role and password are owned by the directory, so those controls are off and only the account's active state can be changed here. How the API does it (find-then-bind, escaped filters, nested groups) is in [its README](../api-stockline/README.md#directory-sign-in-active-directory).

```bash
npm run dev:directory                      # a real Active Directory (Samba AD DC, free), seeded
STOCKLINE_DIRECTORY=1 npm run dev:api      # the API with directory sign-in on
```

Directory demo people (password `Demo-Pass-2026!`): `dan.admin` (buyer + administrator), `ben.buyer`, `sam.supplier`, `pat.production`, `pia.purchasing` (buyer through a nested group), `nina.nogroup` (recognised, not admitted). Browser tests for it need the directory, so they are opt-in: `E2E_DIRECTORY=1 npm run test:e2e`.

## The assistant (Xia)

Xia is a retrieval-augmented assistant: it answers **only** from the documents in [`assistant/knowledge`](assistant/knowledge), cites them, and says so when they do not cover a question. It never sees live data and cannot act for the user. The engine is a separate project ([Xia](../xia): Python, PostgreSQL + pgvector, a local LLM through Ollama); this repo contributes the knowledge base, the integration and the interface.

```
Browser ──Server Action──▶ Next.js server ──short-lived signed token──▶ Xia ──▶ pgvector + LLM
          askAssistant()     signs a 5-minute JWT with the user's        retrieves only the documents
                             id, role and permissions                    those permissions allow
```

- **Identity without sharing the session.** The server signs a five-minute HS256 token carrying only who is asking and their permissions; the user's API token never leaves the server, and the signing secret is never sent to the browser. Xia hides every document the permissions do not allow _before_ the model sees anything (try asking the buyer account how to reset a password, then the admin account).
- **Its own engine instance.** `npm run dev:xia` runs Xia with its own database, signing key and organization name, so nothing else it may know can leak into this assistant.
- **Follows the interface language.** The language is sent with each question; fixed messages ("not covered", errors, quota) are translated here.
- **Degrades quietly.** Without `XIA_URL` and `XIA_JWT_SECRET` the button is simply not shown. Failures (busy model, quota used up, engine down) are specific, translated, and offer a retry only when it can help.
- **Safe rendering.** Answers are parsed into React elements by a tiny Markdown reader ([`markdown.ts`](src/features/assistant/markdown.ts)); model output is never injected as HTML.

```bash
docker start xia-db-1         # PostgreSQL + pgvector (the Xia project's compose file)
npm run dev:xia               # indexes assistant/knowledge, then serves Xia on :8901
# .env.local:  XIA_URL=http://localhost:8901   XIA_JWT_SECRET=<same as the script, 32+ chars>
```

Edit a document or a permission in `assistant/` and re-run `npm run dev:xia -- index`. Browser tests for the assistant need the real engine and a local model, so they are opt-in: `E2E_XIA=1 npm run test:e2e`.

## Docker

```bash
docker compose up --build   # expects api-stockline on the host at :5182
```
