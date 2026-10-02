# Stockline Web

Web client for **Stockline**, a purchase-order management system. Buyers import an order from a spreadsheet, suppliers confirm quantities and costs, the buyer redistributes stock across stores, and the order is pushed to the ERP — with every status change tracked and streamed live.

> Companion to [`api-stockline`](../api-stockline) (.NET 10). Both are portfolio projects with fictitious data.

## What it does

- **Orders**: import an order from a spreadsheet (dry-run check first), then follow it from draft to delivery. Buyers, suppliers and supplier production each see and do only what their role allows: edit confirmed quantities, resolve the production shortfall (skip it or split it into child orders), redistribute stock across locations (with a proportional proposal and saved drafts), send to the ERP and retry. Pages update live through a server-sent event stream.
- **Dashboard**: what is waiting for you, open orders, ERP failures, a 30-day volume chart and the status breakdown.
- **Administration**: users (create, edit, reset password, last-administrator protection), a read-only roles and permissions matrix, locations, and email notification subscriptions with a sandboxed preview.
- **Xia, the assistant**: a side panel that explains how Stockline works from its own documentation (citing it) and looks up your own orders, read-only, with your own permissions. It remembers the conversation, speaks the interface language and never answers from memory. See [The assistant](#the-assistant-xia).
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

Xia answers how Stockline works from its own documentation (citing the documents it used) **and looks up the person's own orders**, read-only. It cannot act for them: it never cancels, confirms or sends anything, it explains the steps. The engine is a separate project ([Xia](../xia): Python, PostgreSQL + pgvector, a local LLM through Ollama); this repo contributes the knowledge base, the tools, the integration and the interface.

```
Browser ─Server Action─▶ Next.js server ──signed 5-min identity──▶ Xia ──▶ local model (tool calling)
  askAssistant()           runs the loop:                          decides: answer, or "I need tools"
                           ◀── tool requests ─────────────────────┘      │ documentation → its own RAG, with the
                           runs them (read-only, the person's own        │ caller's document permissions
                           API session), Zod-validated ──▶ asks again    ▼ never from the model's memory
```

**Who does what.** The model only _proposes_ tool calls. This server validates every argument, runs the tool with the person's own session (the API enforces authorization again), and gives the model back structured data. Xia never holds credentials to read anyone's data.

Defences, each of them measured or tested (`eval/run_tools.py` in Xia, `src/features/assistant/**/*.test.ts`):

- **Data is not instructions.** Order comments and supplier names are typed by other people and can say "ignore your rules". Tool results carry **no free text** (no comments), supplier names are cleaned and shortened, and Xia wraps every result as untrusted data. On a persuasive injected comment `qwen3:8b` asked the user for their password in 7 of 8 runs; wrapping the result brought it to 1 of 8, and leaving the text out entirely to 0 of 8. A final filter blocks any reply that asks for a password or key regardless.
- **The model never answers from memory.** If it asks for no tool on a first step, its text is discarded and the question goes through the documentation pipeline (which also handles small talk). Found the hard way: asked "who can import an order?", it once answered "typically the buyer" without opening the manual.
- **Least privilege.** Tools are offered only for permissions the person holds; there is no tool that changes anything; at most four tools per round and four rounds per question.
- **Links come from data.** "Open PO-2026-017" buttons are built from tool results, never from the model's text.
- **One question, one unit of quota**, however many tool rounds it takes.
- **Identity without sharing the session.** A five-minute HS256 token carries only who is asking and their permissions; the user's API token never leaves this server.
- **Its own engine instance** (`npm run dev:xia`: own database, signing key and organisation name), so nothing else Xia may know can leak in. It follows the interface language, degrades quietly (no `XIA_URL` → no button) and renders answers as React elements, never HTML.

Model choice was measured, not assumed (23 scenarios x 5 runs: tool choice, valid arguments, follow-ups, injection):

| Model                 | Result                                           |
| --------------------- | ------------------------------------------------ |
| `qwen3:8b`            | 98% — used                                       |
| `qwen2.5:7b-instruct` | 86% — also obeys instructions hidden in data     |
| `mistral`             | 29% — advertises tool support but barely uses it |

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
