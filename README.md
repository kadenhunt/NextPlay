# NextPlay

Repository for **NextPlay**, a college-oriented fantasy sports framework. This repo currently ships a **React + TypeScript** frontend with a typed **mock API** layer; database and real HTTP APIs are the next phase.

## Stack (frontend)

- React, TypeScript, Vite, Tailwind CSS
- TanStack Query, React Router
- API seam: `frontend/src/services/api/nextplayApi.ts` → today re-exports `mockNextPlayApi.ts`; swap here for Java (or any) backend without rewriting pages

## Run locally

From repo root:

1. `cd frontend`
2. `npm install`  
   - On Windows, if PowerShell blocks `npm`: `& "C:\Program Files\nodejs\npm.cmd" install`
3. `npm run dev` (open the URL shown, usually `http://localhost:5173`)
4. Production check: `npm run build` — `npm run lint` for ESLint

## Transparency: mock vs “real” shaped app

- **`USES_MOCK_BACKEND`** in `frontend/src/services/api/nextplayApi.ts` — set to `false` when this file points at real HTTP clients; the header **Mock API** notice hides automatically.
- **Dev mode** (UI toggle): persists as `localStorage` key `nextplay.devMode` (`'1'` / `'0'`).  
  - **On:** demo shortcuts (e.g. league state jumps, commissioner bypass, **synthetic season data** when a league shell has empty matchups/standings).  
  - **Off:** no synthetic season fill; still uses the in-browser mock as the backend until you replace the seam.

## Feature snapshot (frontend)

- Auth: login / register, protected routes  
- Dashboard: leagues, create / join  
- League: home, draft, **team**, players, **matchups**, standings, playoffs, chat, settings  
- Draft: board, timer, queue, picks; commissioner controls when applicable  
- Add/drop: Players page + Team page  
- **Scoring:** player-level **stat line → fantasy points** (value × rate → Fp); team **starter totals**; **matchup detail** shows home/away breakdown (parity with Team page). Mock **syncs projected H2H numbers** to the sum of starters for non-final weeks.  
- Insights & boards: mock player/matchup insight, league chat, matchup messages  
- Branding: WKU-inspired reds in Tailwind / assets  

## Backend integration (handoff)

- **Models / contracts:** `frontend/src/types/models.ts`  
- **Mock implementation:** `frontend/src/services/mocks/mockNextPlayApi.ts`  
- **Approach:** keep page-level hooks; replace exports in `nextplayApi.ts` with real clients; preserve (or version) the same DTO shapes.

### Suggested next backend steps

- Auth/session and role claims  
- League + commissioner policy + audit  
- Draft/session controls and picks persistence  
- Roster, scoring engine, and stat feeds (single pipeline for player Fp → team week score → H2H)

## Scope limits (intentional for now)

- Mock persistence: `localStorage` (no shared server state)  
- No WebSocket layer yet (Query refetch model)  
- Draft/scoring rules are **demo-safe**, not final competitive rules  

## Quick demo script (recording)

1. Turn **Dev mode** on if you need jumps or empty leagues filled.  
2. Dashboard → league → optional **Jump to season**.  
3. **Team** → scoring rollup + per-player lines.  
4. **Matchups** → week cards → **View** → home/away scoring breakdown.  
5. **Players** → **View** → player scoring table.  
6. **Standings** to close the loop.

---

Frontend-only details also live in `frontend/README.md`.
