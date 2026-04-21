# Teammate start guide

Casual notes so nobody has to guess what works and what is fake. Technical bits are here when you need them.

## If you only do one thing

From the **repo root**:

```bash
npm run install:frontend
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

Default mode is still mock-friendly. You can optionally enable backend HTTP + server auth via `.env` flags.

## What “works” today

- Full UI flow: register, login, dashboard, leagues, draft, team, players, matchups, standings, chat screens, settings, notifications page, account settings.
- Supported API seam calls can now hit backend routes when `VITE_USE_MOCK_API=false` (players/matchups/standings path).
- Server auth can be enabled with `VITE_USE_SERVER_AUTH=true` + backend `DATABASE_URL` and `JWT_SECRET`.

So you can demo the product shape. You cannot rely on real email, real passwords, or multi-user sync.

## Quick reality check (nothing is broken on purpose)

Think of it in three buckets.

**Already in good shape:** The UI talks to data through one file (`nextplayApi.ts`). Types describe what the server should return. That is the right shape for plugging in a real API later.

**Fine to skip for now:** Automated tests beyond lint and build, a 404 page, a global error catcher, and a checked-in `.env` file. Nice later, not blocking demos.

**Remember when you go real:** User data today lives in the browser only. Real login will need a server, secrets stay out of git, and the team should keep the mock and types matching the API so nothing drifts.

## That email banner on the dashboard

After you **register**, the app assumes your email is **not** verified. **Resend verification** does not send anything. The banner is there on purpose so we do not forget to build real verification later.

**Ways to clear it while developing:**

1. Turn on **Dev mode** in the header if you see it, then use **Mark verified (demo)** on the banner.
2. Or set `localStorage` key **`nextplay.auth.emailVerified`** to **`1`** for that browser, then refresh.

Until the backend sends real mail and sets verified state, the banner is normal.

## How the repo is wired so you can connect everything

The frontend is set up on purpose so you do not hunt through dozens of files.

- **One door:** All data calls go through **`frontend/src/services/api/nextplayApi.ts`**. Pages and components import that path, not the mock file.
- **One shape:** **`frontend/src/types/models.ts`** is the shared contract. If the JSON your API returns matches these types, the UI keeps working.
- **One reference:** **`mockNextPlayApi.ts`** is a working fake server. Same function names as `nextplayApi` exports today. Your real routes can mirror that behavior first, then tighten.

When you are ready, you replace what `nextplayApi.ts` re-exports with your HTTP client and keep signatures aligned. No need to rewrite the dashboard or league screens for the first integration pass.

## Backend weekend starting point

**Goal:** implement endpoints that mirror what the mock already returns, using the same field names and enums as TypeScript.

**Read in this order:**

1. `frontend/src/types/models.ts`  
2. `frontend/src/services/api/nextplayApi.ts`  
3. `frontend/src/services/mocks/mockNextPlayApi.ts`  

The mock file is your **sample payload workshop**. If your JSON matches it, the frontend has a good chance to plug in without rewrites.

**Suggested build order:**

1. Auth: register, login, session or JWT, logout, password reset later, email verification later.  
2. Leagues: list mine, get one, create, join by code.  
3. Team and roster, players list and filters.  
4. Matchups and standings.  
5. Chat messages.

**Frontend integration later:** add an HTTP adapter that implements the same function signatures as `nextplayApi.ts`, then switch the re-export. Env flag idea: `VITE_USE_MOCK_API=false` when you are ready.

**Auth basics for real deploy:** hash passwords, use httpOnly cookies or short-lived tokens plus refresh, protect routes on the server, rate limit login and signup.

## Commands cheat sheet

| What | Command |
|------|---------|
| First time install | `npm run install:frontend` |
| Local app | `npm run dev` |
| Check build | `npm run build` |
| Lint | `npm run lint` |

All from repo root. On Windows PowerShell you can paste these as-is.

## Local env safety (important)

- Put API keys in `backend/.env` only.
- Never commit `.env` files.
- Keep only examples in git: `backend/.env.example`, `frontend/.env.example`.

Quick guard before push:

```bash
git status
git diff --name-only --cached
```

If you ever see `.env` staged, unstage it:

```bash
git restore --staged backend/.env frontend/.env
```

## Repo areas you might touch

- **`frontend/`** is the whole app today.  
- **`database/`** is for SQL and Docker when the server team owns persistence.  
- **`docs/TESTING.md`** is the longer testing and CI plan if you care about pipelines.

## Questions this doc does not answer

Put decisions in PRs or a short design note. If the mock and types disagree, **fix the types and mock together** so the next person is not caught in the middle.
