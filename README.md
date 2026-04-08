# NextPlay

College fantasy sports web app. **Production code today is the React frontend.** All server data is mocked in the browser so UI and types can settle before the real API exists.

## Stack

- **React 19**, **TypeScript**, **Vite 8**
- **Tailwind CSS**, **TanStack Query**, **React Router**
- Auth and persistence: **localStorage** only in mock mode

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

Root `package.json` forwards into `frontend/`. CI uses the same lint and build.

## Repository layout

```
NextPlay/
├── frontend/          Vite app, all UI and the API seam
├── database/          SQL and Docker notes for future backend
├── docs/              Team docs: testing plan, teammate start guide
├── ml/                Future stats or ML notes
└── .github/workflows/ CI
```

## Data and the API seam

UI code imports **`frontend/src/services/api/nextplayApi.ts`**. That module currently re-exports the **mock** in `frontend/src/services/mocks/mockNextPlayApi.ts`. The swap to HTTP should stay inside that layer so pages keep stable imports.

**Why this connects cleanly:** Feature code does not import the mock file directly. Every screen goes through `nextplayApi.ts`, so the backend team can add an HTTP module with the **same exported function names and return types** and flip one re-export. Shared types live in **`types/models.ts`**, so the server contract has a single TypeScript-shaped source of truth next to a working reference implementation in the mock.

**Contract sources for backend work:**

1. `frontend/src/types/models.ts`  
2. `frontend/src/services/api/nextplayApi.ts`  
3. `frontend/src/services/mocks/mockNextPlayApi.ts`  

Match shapes and enum strings here first, then refine behavior.

## Known frontend limitations (mock mode)

- **Email verification:** New accounts are treated as unverified. **Resend does not send mail.** The yellow dashboard banner will stay until either **Dev mode** exposes **Mark verified (demo)** or the real backend drives verification. This is expected until mail and auth APIs exist.
- **Password reset** on the Forgot password page is a UI stub. No email is sent.
- **Dev mode** is visible to everyone in `npm run dev`. For production builds, only emails listed in **`VITE_NEXTPLAY_DEV_OWNER_EMAILS`** (comma separated, `.env` in `frontend/`) see the Dev toggle.

## Theme

Default theme is **dark**. Header basketball control and **Account → Appearance** toggle light and dark. Preference is stored in the browser.

## Documentation

| Doc | Role |
|-----|------|
| **`docs/TEAMMATE-START.md`** | Plain language onboarding, weekend backend starting point, same commands repeated |
| **`docs/TESTING.md`** | Testing and CI roadmap, includes a plain list of test types we might add |

## External APIs (reference)

College data ideas, not wired in repo as a single service yet:

- Football: `https://api.collegefootballdata.com/`
- Basketball: `https://api.collegebasketballdata.com/`
- Baseball: ESPN core API and related feeds

## CI

Workflow runs **`npm run lint`** and **`npm run build`** on pushes and PRs to `main` for `frontend/`.
