# NextPlay Backend

Minimal Express + TypeScript backend scaffold for NextPlay.

This backend is being built in small commit-sized steps to eventually replace the frontend mock API seam in `frontend/src/services/api/nextplayApi.ts`.

## Requirements

- Node.js 20+
- npm
- Local environment variables for external sports APIs

## Setup

1. Create a local env file from the example:

```bash
cp .env.example .env
```

2. Install backend dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for type-safe compile output:

```bash
npm run build
```

## Environment Variables

The backend reads env values from:

- `backend/.env`
- or the repo root `.env`

Required variables:

- `FOOTBALL_BASKETBALL_API_KEY` — CollegeFootballData / related key for **MVP football** player/team data (paste into `backend/.env` only; never commit real keys).
- `BASEBALL_API_KEY`
- `BASEBALL_API_HOST`

Optional variables:

- `PORT` default: `4000`
- `NODE_ENV` default: `development`
- `DATABASE_URL` — Postgres connection string (see repo `docker-compose` / `env_db_example`). When set together with `JWT_SECRET`, enables **real** `POST /api/auth/register`, `POST /api/auth/login`, cookie session, and `GET /api/auth/session`.
- `JWT_SECRET` — long random string used to sign session cookies (generate once per environment).

`DATABASE_URL` and `JWT_SECRET` must either both be set or both be omitted. The server now fails fast on startup if only one is provided.

For local dev with the Vite app, keep **`VITE_API_BASE_URL` empty** in `frontend/.env` so the browser uses the **Vite proxy** (`/api` → backend); that way **httpOnly auth cookies** work on `http://localhost:5173`.

To initialize auth storage locally, run the schema in [database/init.sql](/Users/ahmadjawidkarimi/NextPlay/database/init.sql) against your Postgres database before testing register/login.

## Current Route Summary

### Health

- `GET /health`
  Returns `{ "status": "ok" }`

### Players

- `GET /api/players`
  External-player source endpoint.
  Required query: `sport=football|basketball|baseball`
  Optional query: `search`, `position`, `team`, `status`, `drafted`, `sort`, `year`

- `GET /api/players/:playerId`
  Returns a single player plus projected scoring breakdown.

### Source Data

- `GET /api/source-data/scores`
  Required query: `sport`
  Optional query: `year`, `week`, `team`, `conference`, `seasonType`, `classification`, `date`

- `GET /api/source-data/matchups`
  Required query: `sport`
  Optional query: `year`, `week`, `team`, `conference`, `seasonType`, `classification`, `date`

- `GET /api/source-data/standings`
  Required query: `sport`
  Optional query: `year`, `team`, `conference`, `date`

### Frontend-Contract Alias Routes

These routes are early backend aliases shaped to be closer to the frontend mock seam.

- `GET /api/leagues/:leagueId/players`
  Required query: `sport`

- `GET /api/leagues/:leagueId/players/:playerId`
  Required query: `sport`

- `GET /api/leagues/:leagueId/matchups`
  Required query: `sport`, `week`

- `GET /api/leagues/:leagueId/standings`
  Required query: `sport`

## Implemented vs Placeholder

### Implemented now

- Express app bootstrap
- dotenv loading and env validation
- reusable HTTP client layer
- football/baseball external API service wrappers
- players list/detail endpoints
- source data endpoints for scores, matchups, and standings
- league-scoped alias endpoints for players, matchups, and standings

### Placeholder only

Most non-auth routes below return `501` and a JSON body like:

```json
{
  "message": "Not implemented yet",
  "area": "auth",
  "action": "login"
}
```

### Auth (when `DATABASE_URL` + `JWT_SECRET` are set)

- `GET /api/auth/session` — returns `{ user }` or `401`
- `POST /api/auth/login` — JSON body `{ email, password }`, sets httpOnly cookie
- `POST /api/auth/register` — JSON body `{ email, password, displayName }`, sets cookie
- `POST /api/auth/logout` — clears cookie

### Placeholder routes

- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `GET /api/draft/state`
- `GET /api/leagues`
- `GET /api/leagues/:leagueId`
- `GET /api/teams`
- `GET /api/teams/:teamId`

## Fantasy league gameplay vs external data

- **External APIs** (football, etc.): real college-style player/team feeds for the HTTP-wired surfaces.
- **Your league’s draft, roster moves, and fantasy scoring between members**: still driven by the **frontend mock + `localStorage`** until league state and scoring are persisted and computed on the server. The Postgres schema under `database/` is the starting point for that phase.

## Notes

- `leagueId` and `userId` are not enforced yet in the contract-alignment endpoints.
- `sport` is still required in aligned league routes because real league persistence is not implemented yet.
- Basketball source endpoints currently use safe fallback responses where provider route verification is still pending.
- Football API access depends on a valid current `FOOTBALL_BASKETBALL_API_KEY`.

## Suggested Next Integration Direction

When the frontend is ready to switch from mocks:

1. Add an HTTP adapter inside `frontend/src/services/api/`
2. Keep exported function names aligned with the mock seam
3. Point the frontend seam at the HTTP adapter instead of the mock re-export
