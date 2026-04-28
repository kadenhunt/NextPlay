# NextPlay Test Evidence

Store manual screenshots and terminal captures for the final MVP test run in this folder.

Do not invent evidence files ahead of time. Add them only after running the test and capturing the real result.

## Suggested Evidence Files

### Terminal evidence

- `docs/test-evidence/backend-build.png`
- `docs/test-evidence/backend-startup.png`
- `docs/test-evidence/frontend-build.png`
- `docs/test-evidence/frontend-startup.png`

### API evidence

- `docs/test-evidence/api-health.png`
- `docs/test-evidence/api-leagues.png`
- `docs/test-evidence/api-teams.png`
- `docs/test-evidence/api-my-team-state.png`
- `docs/test-evidence/api-draft-state.png`
- `docs/test-evidence/api-chat-get.png`
- `docs/test-evidence/api-chat-post.png`
- `docs/test-evidence/api-football-players.png`
- `docs/test-evidence/api-baseball-players.png`

### Browser/UI evidence

- `docs/test-evidence/dashboard.png`
- `docs/test-evidence/league-shell.png`
- `docs/test-evidence/football-players.png`
- `docs/test-evidence/baseball-players.png`
- `docs/test-evidence/basketball-hybrid.png`
- `docs/test-evidence/draft-page.png`
- `docs/test-evidence/my-team.png`
- `docs/test-evidence/chat-page.png`
- `docs/test-evidence/matchups-page.png`
- `docs/test-evidence/standings-page.png`

## How to Capture Evidence

1. Run the backend build and take a terminal screenshot showing the command and successful completion.
2. Run the backend dev server and take a terminal screenshot showing the backend listening on `http://localhost:4000`.
3. Run the frontend build and take a terminal screenshot showing the command and successful completion.
4. Run the frontend dev server and take a terminal screenshot showing the local Vite URL.
5. Open each required API URL in a browser, Bruno, Postman, or with `curl`, then capture the response clearly.
6. Open each required UI page in the browser and take a screenshot that shows the page loaded successfully.
7. For basketball, capture the real hybrid/fallback behavior that demonstrates the app stays usable.
8. Save each image using the suggested filename so the final evidence set is easy to review.

## Minimum Manual Capture Set

- Backend build
- Frontend build
- Dashboard
- Football Players page
- Baseball Players page
- Basketball hybrid/fallback page
- Draft page
- My Team page
- Chat page
- At least one screenshot each for:
  - health API
  - leagues API
  - teams API
  - draft state API
  - chat API
  - football players API
  - baseball players API

## Notes

- Browser screenshots are best for UI pages.
- Bruno/Postman screenshots are best for JSON API proof.
- Terminal screenshots are best for build/startup proof.
- If a feature is hybrid or partial, capture the current real behavior rather than trying to stage an idealized result.
