# Financy

**Automatic personal finance manager — navigable web prototype.**

Financy is not a bank-app clone. It aggregates every account a person holds (banks, cards,
digital wallets), automatically detects recurring items — mortgage, car tax, insurance,
subscriptions — and projects the resulting liquidity **12 months into the future**. The product
answers "what will my balance be in six months?", not "what did I spend yesterday?".

> ⚠️ This repository is a **demo prototype**. All financial data is synthetic; there is no real
> bank connection. See [Production notes](#production-notes) before taking anything live.

The user interface is entirely in **Italian** (target market: Italy). Code identifiers,
comments and this document are in English/Italian mixed — see [Conventions](#conventions).

---

## Table of contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Database](#database)
- [HTTP API](#http-api)
- [Widget system](#widget-system)
- [Design system](#design-system)
- [Conventions](#conventions)
- [Testing & QA](#testing--qa)
- [Common tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Production notes](#production-notes)

---

## Quick start

**Requirements:** Node.js **20 LTS** (tested on 20.20.1; 22 also works) and npm ≥ 10.
Nothing else — no accounts, no API keys, no cloud services, no Docker.

```bash
git clone <repo-url> financy    # or unzip the archive
cd financy
npm install                     # ~400 MB, 1–3 min
npm run dev                     # single process: Express + Vite
```

Open **http://localhost:5000**.

`npm run dev` runs the API and the Vite dev server in one process, with HMR. Changes under
`client/` hot-reload; changes under `server/` require restarting the command.

Both `PORT` and `HOST` are configurable (`HOST` defaults to `0.0.0.0`; use `127.0.0.1` if your
machine or firewall refuses the wildcard address). Socket options are platform-aware: `reusePort`
is enabled only on Linux, since Windows and macOS reject it with `ENOTSUP`.

### Console verbosity

`LOG` controls how much the dev server prints:

| Value | Behaviour |
| --- | --- |
| `quiet` (default) | Startup banner plus failed API requests only (status ≥ 400) |
| `verbose` | Every `/api` request with method, status, duration and a response body truncated to 300 chars, plus Vite's info output |
| `silent` | Startup banner only |

```bash
LOG=verbose npm run dev            # macOS / Linux
$env:LOG="verbose"; npm run dev     # Windows PowerShell
```

Known-harmless dependency warnings (the PostCSS `from` option notice, Vite's dependency
re-optimization notice) are filtered out below `verbose`. The filter list lives in
`server/vite.ts` — don't use it to hide real warnings.

To use a different port (macOS AirPlay Receiver sometimes occupies 5000):

```bash
PORT=5173 npm run dev            # macOS / Linux
$env:PORT=5173; npm run dev      # Windows PowerShell
```

**Windows note:** the npm scripts use [`cross-env`](https://www.npmjs.com/package/cross-env), so
inline environment variables work identically in `cmd`, PowerShell and POSIX shells — don't
reintroduce a bare `NODE_ENV=… node …` script, it fails on Windows with
`"NODE_ENV" is not recognized as an internal or external command`.

`better-sqlite3` is a native module. On Node 20 LTS npm downloads a prebuilt
binary. If it tries to compile from source, install the Visual Studio "Desktop development with
C++" workload, or use WSL2.

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |

Both are seeded on first boot. Only the admin sees the **Amministrazione** entry in the sidebar.
Passwords are stored as scrypt hashes with per-user salt — never in plaintext.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (Express + Vite middleware + HMR) on `PORT` (default 5000) |
| `npm run build` | Bundles the server to `dist/index.cjs` and the client to `dist/public/` |
| `npm start` | Runs the production build (`NODE_ENV=production`) |
| `npx tsc --noEmit` | Type-check without emitting — **run before every commit** |

---

## Architecture

```
Browser (React 18 SPA, hash routing)
   │  fetch  ──►  /api/*
   ▼
Express 5  ──►  better-sqlite3  ──►  data/financy.db  (local file, WAL mode)
   │
   └─ dev only: Vite middleware serves and HMRs the client
```

Single Node process, single SQLite file. Deliberately zero external dependencies at runtime so
the prototype can be cloned and run offline at no cost.

**Stack:** React 18 · TypeScript 5.6 · Vite 7 · Tailwind CSS 3 · shadcn/ui (Radix) ·
wouter (hash routing) · Recharts · lucide-react · Express 5 · better-sqlite3 11 · tsx · esbuild.

### Auth model

`POST /api/accesso` verifies the scrypt hash and inserts a random token into the `sessioni`
table. The client keeps the token **in memory only** (`client/src/lib/api.ts`) and sends it as
`Authorization: Bearer <token>`. There is **no** `localStorage`/`sessionStorage` usage anywhere —
storage APIs are blocked in the sandboxed preview iframe, so avoid introducing them.
Consequence: a full page reload requires signing in again.

Two middlewares in `server/routes.ts`: `autenticato` (valid token) and `soloAdmin`
(`ruolo === 'admin'`).

---

## Project layout

```
financy/
├── client/
│   ├── index.html
│   └── src/
│       ├── main.tsx                    entry point
│       ├── App.tsx                     routes (wouter, useHashLocation)
│       ├── index.css                   theme tokens, keyframes (incl. `oscilla` jiggle)
│       ├── components/
│       │   ├── Shell.tsx               app frame: sidebar, header, clickable logo
│       │   ├── Logo.tsx                inline SVG mark
│       │   ├── Comuni.tsx              shared presentational pieces
│       │   ├── widget/
│       │   │   ├── Griglia.tsx         widget grid engine: edit mode, DnD, resize, catalog
│       │   │   └── contenuti.tsx       renderer for each widget type
│       │   └── ui/                     shadcn/ui primitives (do not hand-edit)
│       ├── lib/
│       │   ├── widget.ts               widget types, 14-entry catalog, default layout
│       │   ├── stato.tsx               global state: user, theme, layout persistence
│       │   ├── api.ts                  fetch wrapper; prepends `/api` — see caveat below
│       │   ├── data.ts                 synthetic dataset: accounts, recurrences, tx generator
│       │   ├── format.ts               it-IT currency/date formatting
│       │   ├── queryClient.ts          TanStack Query client
│       │   └── utils.ts                `cn()` helper
│       └── pages/                      Accesso · Panoramica · Conti · Transazioni ·
│                                       Previsioni · Profilo · Admin · not-found
├── server/
│   ├── index.ts                        bootstrap, port binding, Vite wiring
│   ├── routes.ts                       all REST endpoints
│   ├── db.ts                           schema, migrations, scrypt hashing, seed()
│   ├── static.ts                       static file serving in production
│   ├── storage.ts                      storage helpers
│   └── vite.ts                         dev middleware
├── shared/schema.ts                    shared types
├── script/build.ts                     esbuild + vite build pipeline
├── data/financy.db                     SQLite database (git-ignored, auto-created)
├── GUIDA-LOCALE.md                     Italian setup guide (for the product owner)
└── README.md
```

### ⚠️ `api()` path caveat

`api()` already prepends `/api`. Call it with the bare path:

```ts
await api('/layout', { metodo: 'PUT', corpo: { layout } });   // ✅ → /api/layout
await api('/api/layout', { metodo: 'PUT', corpo: { layout } }); // ❌ → /api/api/layout
```

A wrong path returns `200 text/html` (the Vite SPA fallback), so the failure is silent. This
already cost one debugging session — double-check new calls.

---

## Database

SQLite file at `data/financy.db` (plus `-wal` / `-shm`), created and seeded automatically on
first boot by `seed()` in `server/db.ts`. `data/` is git-ignored — never commit it.

**Reset to a clean state:**

```bash
rm -rf data && npm run dev                 # macOS / Linux
Remove-Item -Recurse data; npm run dev     # Windows PowerShell
```

Or, as admin, use **Ripristina dati demo** in the Amministrazione page
(`POST /api/admin/ripristina`).

| Table | Purpose |
| --- | --- |
| `utenti` | id, email, nome, cognome, password (scrypt), avatar (data URL), ruolo, piano, creatoIl, **layout** (JSON widget layout per user) |
| `sessioni` | token, utenteId, creataIl |
| `conti` | aggregated accounts and cards |
| `ricorrenze` | detected recurring items (mortgage, car tax, insurance, subscriptions) |
| `impostazioni` | key/value site settings editable from the admin panel |

Migrations are additive and idempotent: `db.exec('CREATE TABLE IF NOT EXISTS …')` plus
`ALTER TABLE … ADD COLUMN` wrapped in try/catch (see the `layout` column). Follow the same
pattern when adding fields, so existing local databases keep working.

Inspect with [DB Browser for SQLite](https://sqlitebrowser.org) or `sqlite3 data/financy.db ".tables"`.

---

## HTTP API

All payloads are JSON. Protected endpoints need `Authorization: Bearer <token>`.
Every **profile mutation requires the current password in the body** — a hard product
requirement, do not relax it.

### Auth & session

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/accesso` | — | `{ email, password }` → `{ token, utente }` |
| `POST` | `/api/esci` | user | Deletes the session row |
| `GET` | `/api/io` | user | Current user (includes parsed `layout`) |
| `GET` | `/api/pubblico` | — | Public site settings for the login screen |

### User

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `PUT` | `/api/layout` | user | `{ layout }` — widget layout; **no password required** (not sensitive) |
| `PATCH` | `/api/profilo` | user | `{ nome?, cognome?, email?, password }` |
| `POST` | `/api/profilo/password` | user | `{ password, nuova }` |
| `POST` | `/api/profilo/avatar` | user | `{ avatar, password }` — avatar is a data URL |
| `POST` | `/api/conti` | user | Link a new (simulated) account |

### Admin (`soloAdmin`)

| Method | Path | Notes |
| --- | --- | --- |
| `PUT` | `/api/admin/impostazioni` | Update site settings/copy |
| `PUT` `DELETE` | `/api/admin/conti/:id` | Edit / remove an account |
| `POST` | `/api/admin/ricorrenze` | Create a recurrence |
| `PUT` `DELETE` | `/api/admin/ricorrenze/:id` | Edit / remove a recurrence |
| `GET` | `/api/admin/utenti` | List users |
| `PUT` | `/api/admin/utenti/:id` | Edit a user (role, plan, …) |
| `POST` | `/api/admin/ripristina` | Restore demo data |

Errors return `{ messaggio: string }` with a suitable status; the client surfaces `messaggio`
through `ErroreApi` and a toast.

---

## Widget system

iOS-home-screen-style customization of dashboard cards. Currently mounted on **Panoramica**;
the engine is page-agnostic and ready for the rest of the app.

```tsx
<GrigliaWidget pagina="panoramica" rendi={(w) => <ContenutoWidget w={w} d={dati} />} />
```

- **Model** (`client/src/lib/widget.ts`):
  `Widget = { id, tipo, larghezza, altezza, orientamento, limite }`
  - `Larghezza = 3 | 4 | 6 | 8 | 12` — 12-column grid (Piccolo, Medio, Metà riga, Largo, Riga intera)
  - `Altezza = 'bassa' | 'media' | 'alta'`
  - `Orientamento = 'verticale' | 'orizzontale'` — horizontal renders lists as a snap-scrolling row of cards
  - `limite` — row cap for list widgets
- **Catalog:** 14 types grouped as *Numeri chiave* (`kpi-patrimonio`, `kpi-liquidita`,
  `kpi-uscite`, `kpi-previsto`, `kpi-risparmio`, `kpi-minimo`), *Grafici* (`previsione`,
  `grafico`, `salute`) and *Elenchi* (`scadenze`, `conti`, `categorie`, `transazioni`,
  `ricorrenze-nuove`). Each definition declares allowed widths, whether height and orientation
  apply, and its defaults.
- **Edit mode:** triggered by *Personalizza*. Cards jiggle (`.animate-oscilla`, disabled under
  `prefers-reduced-motion`), HTML5 drag & drop reorders, arrow buttons reorder from touch
  devices, ✕ removes, the gear opens a Popover for size/height/orientation/limit, *Aggiungi
  widget* opens the grouped catalog dialog (duplicates allowed, marked "già presente ×N"),
  *Ripristina* restores `LAYOUT_PREDEFINITO`.
- **Persistence:** every change optimistically updates state and fires `PUT /api/layout`,
  stored per user in `utenti.layout`. Users without a stored layout get the default.
- **Grid classes:** `grid grid-cols-2 items-start gap-3 md:grid-cols-6 lg:grid-cols-12`.
  Keep `items-start` — without it, cards stretch to the tallest row item.

### Adding a widget type

1. Add the string to `TipoWidget` and an entry to `CATALOGO` in `client/src/lib/widget.ts`.
2. Handle the new `tipo` in `ContenutoWidget` in `client/src/components/widget/contenuti.tsx`.
3. Optionally add it to `LAYOUT_PREDEFINITO.panoramica`.
4. Give interactive elements `data-testid` attributes (see below).

### Enabling widgets on another page

Add a key to `LAYOUT_PREDEFINITO` (e.g. `conti: [...]`), then render
`<GrigliaWidget pagina="conti" rendi={…} />`. Persistence and edit mode work with no further
changes.

---

## Design system

- **Language:** every user-facing string is **Italian**. No English in the UI.
- **Palette:** deep green primary on neutral surfaces. Light **and** dark theme are both
  mandatory for any new screen — check both before opening a PR.
- **Typography:** headings capped at `text-lg` / `text-xl`; monetary and numeric values use the
  `num` utility for tabular figures so columns align.
- **Formatting:** always go through `client/src/lib/format.ts` for currency and dates (it-IT,
  `1.234,56 €`).
- **Components:** compose from `client/src/components/ui/*` (shadcn/ui). Don't hand-modify those
  primitives; wrap them instead.
- **Prototype "today" is 2026-09-01** — the synthetic dataset is anchored to that date, so
  projections stay reproducible.

---

## Conventions

- **Domain vocabulary is Italian in code too** (`utente`, `conti`, `ricorrenze`, `larghezza`,
  `salvaLayout`). It matches the UI and the product language — keep it consistent rather than
  mixing half-translated identifiers.
- **`data-testid` on every interactive element**, kebab-case and prefixed by role:
  `button-personalizza`, `button-fine-personalizza`, `button-aggiungi-widget`,
  `button-ripristina-layout`, `widget-<tipo>`, `button-rimuovi-<tipo>`, `button-opzioni-<tipo>`,
  `opzione-larghezza-<n>`, `opzione-altezza-<a>`, `opzione-orientamento-<o>`, `link-logo`,
  `text-titolo-pagina`. QA automation depends on these.
- **Routing:** wouter with `hook={useHashLocation}` set on `<Router>` only — never per-route.
- **Radix:** `<SelectItem>` must always have a non-empty `value`.
- **TypeScript:** avoid spreading `Map`/`Set` iterators; use `Array.from(...)` (target config).
- **No web storage:** no `localStorage`/`sessionStorage`. Server-side state or memory only.
- Run `npx tsc --noEmit` before committing; keep commits scoped and messages descriptive.

---

## Testing & QA

There is no automated test suite yet. The current QA process is manual/scripted with
Playwright, and every change should be verified at minimum on:

1. Desktop (≈1280×900) and mobile (390×844) viewports.
2. Light **and** dark theme.
3. Widget edit mode: reorder, resize, orientation switch, add, remove, restore.
4. Persistence: reload and re-login, confirming the layout survives; confirm a second user
   still gets the default layout.
5. Profile mutations: each one must reject a wrong password.

**Good first contribution:** add Vitest + Playwright and codify the checklist above using the
existing `data-testid` selectors.

---

## Common tasks

| Goal | Where |
| --- | --- |
| New widget type | `client/src/lib/widget.ts` + `client/src/components/widget/contenuti.tsx` |
| Change the default dashboard | `LAYOUT_PREDEFINITO` in `client/src/lib/widget.ts` |
| Widgets on another page | `<GrigliaWidget pagina="…">` + new `LAYOUT_PREDEFINITO` key |
| Colors, radii, fonts | `client/src/index.css`, `tailwind.config.ts` |
| Synthetic dataset | `client/src/lib/data.ts` |
| New endpoint | `server/routes.ts` (+ `server/db.ts` for schema) |
| Navigation / sidebar / header | `client/src/components/Shell.tsx` |
| Admin-editable copy | `impostazioni` table, edited from the Amministrazione page |

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `EADDRINUSE :5000` | `PORT=5173 npm run dev`, or disable macOS *Settings → General → AirDrop & Handoff → AirPlay Receiver* |
| `better-sqlite3` build failure | Use Node 20 LTS (`nvm install 20 && nvm use 20`), then `rm -rf node_modules package-lock.json && npm install` |
| API call returns HTML with status 200 | Wrong path — `api()` already prepends `/api`. See the [caveat](#-api-path-caveat) |
| Blank page | Check the browser console; confirm the terminal shows `serving on port …` and you are on `http://localhost:5000` (not https) |
| Login fails | Delete `data/` and restart to reseed demo users |
| `ENOTSUP: operation not supported on socket 0.0.0.0:5000` | Older checkout: `httpServer.listen` passed `reusePort: true`, which only Linux supports. Remove it (it is now set only when `process.platform === 'linux'`) |
| `"NODE_ENV" is not recognized…` on Windows | You are on an older checkout: scripts must be wrapped in `cross-env`. Run `npm i -D cross-env` and use `cross-env NODE_ENV=development tsx server/index.ts` |
| Server changes not applied | Files under `server/` need a restart of `npm run dev`; `client/` hot-reloads |
| Logged out after reload | Expected: the token lives in memory only (no web storage by design) |

---

## Production notes

This is a prototype. Before anything resembling production:

- **Open banking.** Real aggregation requires a PSD2 provider — Fabrick, Tink, GoCardless,
  Powens, finAPI or Enable Banking — plus an AISP licence or an agreement with an authorised
  intermediary. Access must stay read-only; Financy never initiates payments.
- **Auth hardening.** Replace in-table bearer tokens with signed, expiring sessions in
  httpOnly + Secure cookies; add rate limiting on `/api/accesso`, CSRF protection, and 2FA.
- **Data protection.** Enforce HTTPS everywhere, encrypt data at rest, define GDPR retention
  and deletion flows, and move avatars out of the database into object storage instead of
  storing data URLs.
- **Database.** SQLite is right for a local prototype. Multi-instance deployment means moving
  to Postgres (Drizzle is already a dependency, so the migration path exists).
- **Observability & CI.** Add structured logging, error tracking, and a pipeline running
  `npx tsc --noEmit`, lint and the future test suite on every PR.
