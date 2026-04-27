# NextPlay

College fantasy sports web app. The app is now **hybrid**: frontend mock league logic is still used for gameplay state, while selected backend HTTP routes provide real external sports data (football first).

## Stack

- **React 19**, **TypeScript**, **Vite 8**
- **Tailwind CSS**, **TanStack Query**, **React Router**
- Auth: mock by default, optional server-backed auth behind env flags
- Persistence: mock league state in localStorage today; Postgres schema + backend auth scaffold in repo

## Requirements

- **Node.js** 20 or newer recommended
- **npm** at repo root
- Optional: copy **`frontend/.env.example`** to **`frontend/.env`** when you add Vite env vars. Real secrets never go in git.

## Commands

Run these from the **repository root** unless you prefer `cd frontend` and local npm scripts there.

| Step | Command |
|------|---------|
| Install frontend dependencies | `npm run install:frontend` |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |

Root `package.json` forwards into `frontend/`. CI now checks both frontend and backend TypeScript builds.

## Repository layout

```
NextPlay/
├── frontend/          Vite app, all UI and the API seam
├── backend/           Express + TypeScript API (external data + auth scaffold)
├── database/          Postgres schema and Docker init
├── docs/              Team docs: testing plan, teammate start guide
├── ml/                Future stats or ML notes
└── .github/workflows/ CI
```

## Data and the API seam

UI code imports **`frontend/src/services/api/nextplayApi.ts`**. That seam now supports a **hybrid mode**: mock by default, with HTTP-enabled functions for supported endpoints when env flags are set.

**Why this connects cleanly:** Feature code does not import the mock file directly. Every screen goes through `nextplayApi.ts`, so the backend team can add an HTTP module with the **same exported function names and return types** and flip one re-export. Shared types live in **`types/models.ts`**, so the server contract has a single TypeScript-shaped source of truth next to a working reference implementation in the mock.

**Contract sources for backend work:**

1. `frontend/src/types/models.ts`  
2. `frontend/src/services/api/nextplayApi.ts`  
3. `frontend/src/services/mocks/mockNextPlayApi.ts`  

Match shapes and enum strings here first, then refine behavior.

## Current MVP limitations

- **League gameplay persistence/scoring:** still mock/localStorage for league-specific draft, roster, and scoring flows.
- **Email + password reset mail:** still stubbed (no outbound email provider wired yet).
- **Server auth:** optional and disabled by default unless backend `DATABASE_URL` + `JWT_SECRET` and frontend `VITE_USE_SERVER_AUTH=true` are set.
- **Dev mode** is visible to everyone in `npm run dev`. For production builds, only emails listed in **`VITE_NEXTPLAY_DEV_OWNER_EMAILS`** (comma separated, `.env` in `frontend/`) see the Dev toggle.

## Demo runbook (final week)

Use one of these two predictable modes:

1. **Stable seeded demo mode (recommended for live class demo)**
   - `frontend/.env`: `VITE_USE_MOCK_API=true`
   - Auth can still be server-backed if desired: `VITE_USE_SERVER_AUTH=true`
   - Best for consistent league/draft/team state and reduced demo risk.

2. **Backend data mode (for integration proof)**
   - `frontend/.env`: `VITE_USE_MOCK_API=false`
   - Uses HTTP adapter for supported seam functions (`getPlayers`, `getPlayerById`, `getMatchups`, `getStandings`).

### Local auth prerequisites

- Start Docker Desktop
- From repo root: `docker compose up -d postgres`
- Initialize schema: `database/init.sql` into Postgres
- In `backend/.env`, set `DATABASE_URL` and `JWT_SECRET`
- In `frontend/.env`, set `VITE_USE_SERVER_AUTH=true`

## Theme

Default theme is **dark**. Header basketball control and **Account → Appearance** toggle light and dark. Preference is stored in the browser.

## Documentation

| Doc | Role |
|-----|------|
| **`docs/TEAMMATE-START.md`** | Plain language onboarding, weekend backend starting point, same commands repeated |
| **`docs/TESTING.md`** | Testing and CI roadmap, includes a plain list of test types we might add |

## External APIs (MVP status)

- Football/Basketball provider key path is wired in backend; football endpoints are the primary MVP target.
- Baseball provider host/key path is wired; data completeness varies by endpoint.
- Basketball players currently fall back to mock where upstream returns non-JSON.

## CI

Workflow runs frontend lint/build plus backend TypeScript build on pushes and PRs to `main`.
