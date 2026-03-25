# NextPlay Frontend Handoff (From Kaden)

Hey team - this is my frontend handoff snapshot for tomorrow's demo and our backend integration phase.

I kept the frontend in React + TypeScript + Vite + Tailwind with a typed mock API seam so we can swap in real Java endpoints without ripping up page components.

## What I Finished On Frontend

- Authentication screens: login/register + protected routes
- Dashboard: league list, create/join league modals
- League pages: home, draft, team, players, matchups, standings, chat
- Commissioner-only: league settings, member management, draft controls
- Draft UX: on-clock display, pick timer, draft board, player queue
- Add/Drop flow: pick up from Players page, drop from Team page
- Playoffs view: bracket-lite presentation in playoffs state
- Predictive cards: mock player/matchup insights (read-only)
- Message boards: league chat + matchup-specific discussion

## Draft Demo Controls (What I Added)

During `DRAFT_IN_PROGRESS`, commissioner controls include:

- Start / pause draft
- Skip current pick -> performs auto-pick for on-clock team
- Enable/disable auto mode for on-clock team

### Demo Mode Toggle (easy on/off)

I made advanced draft demo controls toggleable so we can use them in class but still keep normal flow:

- **Env toggle (recommended):** set `VITE_DEMO_DRAFT_MODE=1`
- **Quick browser toggle:** set localStorage key `nextplay.demo.draftMode = "1"`

Turn off by setting env value to `0` (or removing it) and clearing the localStorage key.

## How To Run Locally

From repo root:

1. `cd frontend`
2. Install deps:
  - `npm install`
  - If PowerShell blocks `npm`, use: `& "C:\Program Files\nodejs\npm.cmd" install`
3. (Optional) enable demo controls:
  - create `frontend/.env.local` with:
    - `VITE_DEMO_DRAFT_MODE=1`
4. Start dev server:
  - `npm run dev`
  - or PowerShell-safe: `& "C:\Program Files\nodejs\npm.cmd" run dev`
5. Open the local URL shown in terminal (usually `http://localhost:5173`)

### Build + Lint

- `npm run build`
- `npm run lint`

## Backend Integration Notes (for API handoff)

- Frontend API seam: `frontend/src/services/api/nextplayApi.ts`
- Current implementation: `frontend/src/services/mocks/mockNextPlayApi.ts`
- Integration approach I followed:
  - keep page hooks/components as-is
  - replace mock exports in API seam with real HTTP client calls
  - preserve model contracts in `frontend/src/types/models.ts`

## Known Intentional Scope (for now)

- Mock storage uses localStorage and mock timing/error simulation
- No websocket/realtime transport yet (polling + refetch model)
- Draft logic is demo-safe, not final competitive rules logic

## Suggested Next Backend Steps

- Implement auth/session endpoints and role claims
- Implement league settings + audit endpoints
- Implement draft control endpoints (start/pause/skip/team auto)
- Implement roster transaction endpoints with server validation

