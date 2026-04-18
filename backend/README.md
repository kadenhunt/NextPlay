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

- `FOOTBALL_BASKETBALL_API_KEY`
- `BASEBALL_API_KEY`
- `BASEBALL_API_HOST`

Optional variables:

- `PORT` default: `4000`
- `NODE_ENV` default: `development`

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

These currently return `501` and a JSON body like:

```json
{
  "message": "Not implemented yet",
  "area": "auth",
  "action": "login"
}
```

Placeholder routes:

- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `GET /api/draft/state`
- `GET /api/leagues`
- `GET /api/leagues/:leagueId`
- `GET /api/teams`
- `GET /api/teams/:teamId`

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
