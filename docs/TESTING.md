# Testing & CI plan (NextPlay)

**Purpose of this doc:** The team started testing and automation here. It is a base to build on, not a finished QA program. CI already runs **lint + build**. Everything else below is **planned** so database, frontend, and future backend work can pick up tasks without redoing the roadmap.

This matches the root **README**: frontend today, mock adapter, SQL under `database/`, real backend and ML later. Use it to split work and grow **GitHub Actions** toward full **CI/CD** when you are ready.

---

## Revision log

| Date | Version | Owner | Rationale |
|------|---------|-------|-----------|
| 2026-04-09 | 1.0 | Team | Established initial testing baseline and CI scope for first submission. |
| 2026-04-16 | 1.1 | Team | Expanded testing categories to include integration, security, accessibility, and performance planning. |
| 2026-04-20 | 1.2 | Team | Updated CI references to include backend TypeScript build and clarified frontend/backend test ownership. |
| 2026-04-25 | 1.3 | Team | Added deeper execution detail in preparation for final deliverables and aligned testing scope with current MVP implementation. |

---

## Kinds of tests we might add (plain names)

| Kind | What it means | Example in this project |
|------|----------------|-------------------------|
| **Lint** | Style and common bug patterns in code | ESLint on every PR today |
| **Build / typecheck** | TypeScript compiles, Vite build succeeds | `npm run build` on every PR today |
| **Unit** | One function or small module in isolation | League gate helpers in `utils`, scoring math if pulled out of the mock |
| **Component** | A React piece with fake props or context | A form or button with Testing Library |
| **Integration (frontend)** | A few pieces together, still no real browser | Query hook plus mock API |
| **E2E** | Real browser clicks a path like a user | Playwright: login to dashboard, open a league |
| **API / contract** | HTTP responses match agreed JSON | After backend exists: OpenAPI or fixed fixtures |
| **Accessibility** | Keyboard, contrast, screen reader basics | Manual checklist, later optional axe in CI |
| **Database** | Migrations apply on empty DB | Docker one-shot when server work lands |

Right now only the first two run in CI. The table is the menu for later phases below.

---

## Current baseline (today)

| Layer | What runs | Who / when |
|--------|-----------|------------|
| **TypeScript** | `npm run build` (`tsc -b` + Vite) | Every PR via CI |
| **ESLint** | `npm run lint` | Every PR via CI |
| **Manual** | Click-through demo, Dev mode, Reset data | Before presentations |

There is **no `npm run test` yet**. That is intentional until someone adds a test runner (see Phase 1).

**CI today:** `.github/workflows/ci.yml` runs **lint + build** on `frontend/` for pushes and PRs to `main`.

---

## Phase 0 — Keep CI green (anyone can own this)

- [ ] Open a small PR that only touches copy or UI; confirm the **CI** check passes.
- [ ] Document in PR template (optional): “Ran `npm run lint` and `npm run build` locally.”

**Goal:** Everyone knows the pipeline exists and must stay green.

---

## Phase 1 — Unit / integration tests (frontend)

**Tools (recommended):** **Vitest** + **React Testing Library** (fits Vite; same project as the app).

**Start small:**

1. Add dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
2. Add `npm run test` and `npm run test:ci` (Vitest run once, no watch).
3. First targets (high value, low drama):
   - **Pure functions** in `frontend/src/utils/**` (e.g. league gates, formatters).
   - **Mock API helpers:** deterministic functions in `mockNextPlayApi.ts` if you extract any (for example scoring math) into testable modules.
4. **Adapter contract smoke:** one test that imports `nextplayApi` and asserts a function exists (guards accidental export breaks).

**CI:** Add a job step after lint: `npm run test:ci` (only after the script exists).

---

## Phase 2 — End-to-end (E2E) smoke

**Tools:** **Playwright** or **Cypress.** Pick one for the team.

**Minimal suite:**

- Login (or dev seed user) → Dashboard loads.
- Open a league → Team page renders without crash.
- Matchups page loads when league is in season (may require Dev mode or seeded data).

Run E2E on **main** only or on PRs with label `e2e` if runtime/cost matters.

---

## Phase 3 — Database & backend (when teammates ship them)

Align with **Hudson’s `database/`** work and any future API:

| Area | Examples |
|------|-----------|
| **SQL** | Validate `database/init.sql` applies cleanly on empty Postgres (Docker one-shot in CI). |
| **Migrations** | If you add Flyway/Liquibase, run migrate on CI against ephemeral DB. |
| **API** | Contract tests (OpenAPI + Dredd or Postman/Newman) or JUnit + Testcontainers for Java. |

**Rule:** Server-side **scoring and authorization** must be tested on the backend — the UI adapter only reflects what the API returns.

---

## Phase 4 — ML / analytics (optional, later)

When `ml/` grows (see root **README** repo layout):

- **Unit tests** for feature builders (`features.py`).
- **Regression tests** on a tiny frozen CSV (expected MAE within tolerance).
- **No need** to run heavy training in CI; run **evaluation** on a small artifact or nightly workflow.

---

## GitHub Actions → “CI/CD”

| Stage | Typical trigger | What it does |
|--------|------------------|--------------|
| **CI** | Push / PR | Lint, build, unit tests (later E2E). |
| **CD** (later) | Tag or `main` merge | Deploy static site (e.g. GitHub Pages, Vercel, Azure Static Web Apps) or container. |

This repo only adds **CI** for now. **CD** is a one-line addition when you choose a host (build artifact → upload).

---

## Suggested ownership (lightweight)

| Person / area | First task |
|---------------|------------|
| Anyone | Keep CI green; fix lint errors in your PR. |
| Hudson / DB | Add “apply init.sql in Docker” job when ready. |
| Frontend | Phase 1: Vitest + 2–3 tests in `utils`. |
| Full stack later | Phase 3: API tests against test DB. |

---

## Quick commands (frontend)

```bash
cd frontend
npm ci
npm run lint
npm run build
# After Phase 1:
# npm run test:ci
```

See also: root **README** (architecture, backend handoff, ML roadmap).
