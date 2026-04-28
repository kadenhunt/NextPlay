# NextPlay Test Results

This document organizes the final MVP/hybrid test evidence for submission.

It does not contain screenshots directly. Instead, it tells the tester what proof to capture and where to store it under [docs/test-evidence/README.md](/Users/ahmadjawidkarimi/NextPlay/docs/test-evidence/README.md).

## Evidence Index

| Result Area | What to Verify | Visual Proof to Capture | Suggested File |
|-------------|----------------|-------------------------|----------------|
| Backend build | `cd backend && npm run build` completes successfully | Terminal screenshot showing successful build output | `docs/test-evidence/backend-build.png` |
| Backend startup | `cd backend && npm run dev` starts server | Terminal screenshot showing server started on port `4000` | `docs/test-evidence/backend-startup.png` |
| Frontend build | `cd frontend && npm run build` completes successfully | Terminal screenshot showing successful build output | `docs/test-evidence/frontend-build.png` |
| Frontend startup | `cd frontend && npm run dev` starts Vite | Terminal screenshot showing Vite local URL | `docs/test-evidence/frontend-startup.png` |
| API health | `GET /health` returns success | Browser, curl, Bruno, or Postman screenshot showing `200` and `{ "status": "ok" }` | `docs/test-evidence/api-health.png` |
| API leagues | `GET /api/leagues?userId=user_1` returns seeded leagues | Browser, curl, Bruno, or Postman screenshot showing JSON response | `docs/test-evidence/api-leagues.png` |
| API teams | `GET /api/teams?userId=user_1` returns seeded teams | Browser, curl, Bruno, or Postman screenshot showing JSON response | `docs/test-evidence/api-teams.png` |
| API my-team state | `GET /api/teams/my-state?userId=user_1&leagueId=2` returns seeded team state | Browser, curl, Bruno, or Postman screenshot showing JSON response | `docs/test-evidence/api-my-team-state.png` |
| API draft state | `GET /api/draft/state?userId=user_1&leagueId=2` returns draft state | Browser, curl, Bruno, or Postman screenshot showing JSON response | `docs/test-evidence/api-draft-state.png` |
| API chat messages | `GET /api/chat/messages?userId=user_1&leagueId=2` returns messages | Browser, curl, Bruno, or Postman screenshot showing JSON response | `docs/test-evidence/api-chat-get.png` |
| API post chat | `POST /api/chat/messages` appends a message | Bruno, Postman, or terminal screenshot showing request body and updated response | `docs/test-evidence/api-chat-post.png` |
| Football player API | Football backend player read returns data | Browser, curl, Bruno, or Postman screenshot showing football player JSON | `docs/test-evidence/api-football-players.png` |
| Baseball player API | Baseball backend player read returns real data or valid empty result | Browser, curl, Bruno, or Postman screenshot showing baseball player JSON | `docs/test-evidence/api-baseball-players.png` |
| Basketball hybrid behavior | Basketball flow falls back safely instead of crashing | Browser screenshot showing usable basketball Players page behavior | `docs/test-evidence/basketball-hybrid.png` |
| Dashboard | Dashboard renders league cards and summary | Browser screenshot of dashboard view | `docs/test-evidence/dashboard.png` |
| League shell | League header/tabs/navigation render correctly | Browser screenshot of league shell | `docs/test-evidence/league-shell.png` |
| Football Players page | Football player pool loads | Browser screenshot of football Players page | `docs/test-evidence/football-players.png` |
| Baseball Players page | Baseball player pool loads | Browser screenshot of baseball Players page | `docs/test-evidence/baseball-players.png` |
| Draft page | Draft page loads and shows draft state | Browser screenshot of Draft page | `docs/test-evidence/draft-page.png` |
| My Team page | Team page loads and shows roster/lineup state | Browser screenshot of Team page | `docs/test-evidence/my-team.png` |
| Chat page | Chat page loads and can show sent messages | Browser screenshot of Chat page | `docs/test-evidence/chat-page.png` |
| Matchups page | Matchups page loads | Browser screenshot of Matchups page | `docs/test-evidence/matchups-page.png` |
| Standings page | Standings page loads | Browser screenshot of Standings page | `docs/test-evidence/standings-page.png` |

## Suggested API URLs

- `http://localhost:4000/health`
- `http://localhost:4000/api/leagues?userId=user_1`
- `http://localhost:4000/api/teams?userId=user_1`
- `http://localhost:4000/api/teams/my-state?userId=user_1&leagueId=2`
- `http://localhost:4000/api/draft/state?userId=user_1&leagueId=2`
- `http://localhost:4000/api/chat/messages?userId=user_1&leagueId=2`
- `http://localhost:4000/api/players?sport=football&search=Williams&year=2025`
- `http://localhost:4000/api/players?sport=baseball&search=Andrew`
- `http://localhost:4000/api/leagues/1/players?userId=user_1&sport=football&search=Williams&year=2025`
- `http://localhost:4000/api/leagues/3/players?userId=user_1&sport=baseball&search=Andrew`

## Suggested Local Commands

Backend:

```bash
cd /Users/ahmadjawidkarimi/NextPlay/backend
npm install
npm run build
npm run dev
```

Frontend:

```bash
cd /Users/ahmadjawidkarimi/NextPlay/frontend
npm install
npm run build
npm run dev
```

## What To Attach Before Submission

- Build proof for backend and frontend
- Startup proof for backend and frontend
- At least one API response proof for each major backend area:
  - health
  - leagues
  - teams
  - draft state
  - chat
  - football players
  - baseball players
- UI screenshots for:
  - dashboard
  - league shell
  - football players
  - baseball players
  - basketball hybrid/fallback
  - draft
  - my team
  - chat
  - matchups
  - standings

## Hybrid MVP Note

Basketball should be documented as an approved hybrid path. The evidence should show that the app remains usable and does not crash even when the live basketball provider is not used for the player pool.
