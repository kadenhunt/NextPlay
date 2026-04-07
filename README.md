# NextPlay

College-oriented **fantasy sports** app: draft leagues, lineups, matchups, scoring, and chat. This repo is **frontend-first** — React + TypeScript + Vite + Tailwind — with a typed **mock API** (`localStorage`) until a real backend ships.

**Quick links:** [Find your way around](#find-your-way-around-new-teammates) · [Run locally](#run-locally) · [Testing and CI](#testing-and-ci-starter-base) · [Architecture & patterns](#architecture--patterns) · [What to say in reviews / class](#what-to-say-in-reviews--class) · [ML & predictions roadmap](#ml--predictions-roadmap) · [Demo](#demo-recording)

---

## Find your way around (new teammates)

| Question | Answer |
|----------|--------|
| **Where is the app?** | Almost all UI and logic live in **`frontend/`**. Open that folder in your editor; run commands from there (see [Run locally](#run-locally)). |
| **What is this repo for?** | A **demo-ready fantasy client** with a stable **API seam** so you can swap the mock for a real Java/HTTP backend later. Types in `frontend/src/types/models.ts` are the contract. |
| **Where is the “database”?** | **SQL seed / Docker helpers** are under **`database/`** (e.g. `init.sql`). The running app today uses the **mock** in `frontend/src/services/mocks/` — not Postgres in the browser. |
| **Where are plans and testing notes?** | **`docs/TESTING.md`** — phased testing plan and how CI may grow. **`ml/README.md`** — ML folder conventions when that work starts. |
| **What runs on GitHub?** | **[`.github/workflows/ci.yml`](.github/workflows/ci.yml)** — ESLint + production **build** for `frontend/` on pushes/PRs to `main`. |

**Repo layout (high level):**

```
NextPlay/
├── frontend/          # React app — start here for daily work
├── database/          # SQL + Docker entrypoint (backend/DB work)
├── docs/              # TESTING.md and other team docs
├── ml/                # Future ML / notebooks (see ml/README.md)
└── .github/workflows/ # CI (lint + build today)
```

---

## Testing and CI (starter base)

**Where we stopped:** The team set up a **foundation**, not a full test suite. That is intentional.

- **Today:** CI runs **`npm run lint`** and **`npm run build`** in `frontend/` so every PR proves the app still compiles and passes ESLint.
- **Not done yet:** No `npm run test` / Vitest / Playwright in the repo until someone adds them. The **roadmap** for unit tests, E2E, DB/API jobs, and later CD is spelled out in **[`docs/TESTING.md`](docs/TESTING.md)** — use that as the shared backlog to split with Hudson (database) and others.

If you only read one extra doc for quality gates, read **`docs/TESTING.md`**. If you only run two commands before pushing, run **`npm run lint`** and **`npm run build`** from `frontend/`.

---

## Run locally

From repo root:

1. `cd frontend`
2. `npm install` (Windows: if needed, `& "C:\Program Files\nodejs\npm.cmd" install`)
3. `npm run dev` → open the URL (often `http://localhost:5173`)
4. `npm run build` / `npm run lint` — production build and ESLint

More detail: `frontend/README.md`.

---

## Stack (frontend)

| Piece | Role |
|--------|------|
| **React + TypeScript** | UI and type-safe components |
| **Vite** | Dev server and production bundle |
| **Tailwind CSS** | Styling (brand reds anchored for WKU-style palette) |
| **TanStack Query** | Server-state: fetch, cache, loading/error, refetch |
| **React Router** | Auth routes, nested `/league/:id/...` |
| **TypeScript models** | Shared shapes in `frontend/src/types/models.ts` |

---

## Architecture & patterns

### API seam = **Adapter** (and a thin **Facade**)

- Pages import **only** `frontend/src/services/api/nextplayApi.ts`. That module is the stable **port**.
- Today it re-exports **`mockNextPlayApi.ts`** — one **adapter** (in-browser, `localStorage` persistence).
- Later you add another adapter: HTTP clients (`fetch` / `axios`) to your Java REST API with the **same function signatures** → UI components stay unchanged.
- The single re-export file also acts like a **Facade**: one entry point for many operations instead of scattering imports across mock vs HTTP.

Related names you might hear: **ports and adapters** (hexagonal), **strategy**-like swap of implementations behind one interface.

### Why not fetch inside random components?

**Separation of concerns**: UI handles rendering and interaction; the API module owns *how* data is loaded (mock vs HTTP, auth headers, base URL, error mapping). Easier to test and replace.

### “Server state” without a server yet

**TanStack Query** (`useQuery`, `useMutation`) treats data as remote: caching, stale times, invalidation after mutations. That pattern stays when the backend is real.

### Routing & state

- **Layouts:** `RootLayout` (global chrome), `LeagueLayout` (league tabs + `LeagueProvider`).
- **URL** carries `leagueId` (`/league/:id/...`).
- **Context** for auth and current league metadata.
- **Local state** for forms, modals, draft UI.
- **Query cache** for lists (leagues, players, matchups, etc.).

### Mock persistence & flags

- Mock “DB” lives in **`localStorage`** (see mock module). No shared multi-user state.
- **`USES_MOCK_BACKEND`** in `nextplayApi.ts` — flip when the module exports real clients (build flags / future UI).
- **Dev mode** (`localStorage` `nextplay.devMode`): unlocks testing shortcuts (state jumps, commissioner bypass in mock, **synthetic season rows** when a league shell has empty matchups/standings). **Off** = no synthetic fill, still mock-backed until the real adapter exists.
- **Play Demo** (header, when Dev + logged in): timed navigation through key routes; prefers **baseball** league when present for richer seed data.
- **Reset data** (dashboard, Dev on): restores mock seed.

---

## Feature snapshot

- Auth: login / register, protected routes  
- Dashboard: leagues, create / join  
- League: overview, draft, team, players, matchups, standings, playoffs, chat, settings  
- Draft: board, timer, queue, picks; commissioner controls when applicable  
- Add/drop from Players / Team  
- **Scoring UX:** per-player stat lines (**value × rate → fantasy points**), team **starter totals**, matchup modal **home/away** breakdown; mock **syncs projected H2H** to sum of starters for non-final weeks  
- Insights & chat: mock player/matchup insight, league chat, matchup board  

---

## Backend handoff

| Asset | Location |
|--------|-----------|
| Contracts / DTOs | `frontend/src/types/models.ts` |
| Mock implementation | `frontend/src/services/mocks/mockNextPlayApi.ts` |
| Swap point | `frontend/src/services/api/nextplayApi.ts` |

**Suggested backend order:** auth + sessions + roles → league CRUD + commissioner policy → draft session + picks with server validation → roster transactions → **scoring engine** (stats → rules → weekly fantasy points → matchups / standings).

**Production scoring** should be **authoritative on the server**; the app displays results and submits lineup changes within allowed rules.

**Realtime:** not in the prototype; next step is often **WebSockets** or **SSE** for draft clock / live scores, or polling for MVP.

---

## What to say in reviews / class

Use these as sound bites — expand only if asked.

- **“What pattern is the API?”** → **Adapter** at `nextplayApi.ts`; mock and HTTP are interchangeable. Often also called a **Facade** because one module fronts many calls.
- **“How do you swap the backend?”** → Replace what `nextplayApi.ts` exports; keep **types** aligned with API responses.
- **“Where’s the contract?”** → **`models.ts`** — frontend DTOs should match (or version) backend JSON.
- **“How is async data handled?”** → **TanStack Query** for fetch/cache/mutations.
- **“Global state?”** → **Context** for auth/league; **URL** for league id; **Query** for server-shaped lists.
- **“Is insight ML?”** → **Not yet** — mock/heuristic; real pipeline slots in behind the same API shapes (see below).
- **“One sentence?”** → *Stable API seam with an adapter for mock vs HTTP, React Query for remote data, TypeScript models as the contract — swap the backend without rewriting pages.*

---

## ML & predictions roadmap

Insights today (`getPlayerInsights`, `getMatchupInsight`) are **placeholders**. A credible path:

**Goals (pick 1–2):** (1) better weekly **fantasy projections**, (2) **trend** labels with confidence, (3) **matchup win probability** with calibration.

**Data you’ll need eventually:** raw **box scores / stat lines**, league **scoring rules**, weekly **lineups** and **actual fantasy points**; optional **labels** for supervised learning (beat projection? matchup outcome?).

**Phase 0 — Baselines (no ML):** rolling averages of Fp, z-scores / percentiles for “trend”, simple team-vs-team narrative from weekly scores.

**Phase 1 — Tabular ML:** feature rows (recent Fp, opponent strength, home/away, rest, …) → regression / tree models; **time-based train/val split** (don’t shuffle weeks randomly — leakage).

**Phase 2 — Integration:** `[ingest] → [features] → [inference] → REST` (e.g. `/insights/...`); frontend **keeps the same adapter**; optionally mock adapter for local dev. Start with **batch** jobs, then realtime if needed.

**Phase 3 (optional):** sequence models, probability **calibration** (Platt / isotonic).

**Ethics:** present as **assistive** projections with uncertainty; be explicit about data sources and any future user data policy.

**Repo shape when you code:** under `ml/` add `notebooks/`, `src/` (`features`, `train`, `evaluate`), `artifacts/` (gitignored if large). See `ml/README.md`.

---

## Scope limits (intentional)

- No shared server DB in this repo yet  
- No WebSocket layer  
- Draft / scoring rules are **demo-safe**, not final competitive rules  

---

## Demo recording

1. **Dev mode** on if you need jumps or synthetic season fill.  
2. **Dashboard** → open **baseball** league (or use **Play Demo**).  
3. **Team** → scoring rollup + per-player lines.  
4. **Matchups** → **View** → home/away breakdown.  
5. **Players** → **View** → player scoring table.  
6. **Standings** to close the loop.  
7. **Reset data** if you need a clean mock seed.

---

## API Documentation and Sites

**Football
 - All API Fetching: https://api.collegefootballdata.com/
 - Documentation: https://api.collegefootballdata.com/

**Basketball
 - All API Fetching: https://api.collegebasketballdata.com/
 - Documentation: https://api.collegebasketballdata.com/

**Baseball
 - Live Scores API Fetching: https://sports.core.api.espn.com/v3/sports/baseball/
 - Live Scores API Documentation: https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/baseball.md
 - Players, Teams, etc. API Fetching: https://mlb-college-baseball-api.p.rapidapi.com/
 - Players, Teams, etc. API Documentation: https://highlightly.net/mlb-api/documentation/

*For day-to-day frontend commands and paths, see `frontend/README.md`. For the testing/CI roadmap and backlog, see `docs/TESTING.md`.*
