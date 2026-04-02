# NextPlay frontend

This is the **main application** in the NextPlay repo: demo-ready UI for core fantasy flows, with a **single API seam** for backend swap-in.

**Parent repo:** Everything about *where* the project lives, *what* it is for, and the **testing/CI starter base** (lint + build today; full tests later) is in **[`../README.md`](../README.md)** — start there if you are new.

**Pattern:** **Adapter** — pages import `src/services/api/nextplayApi.ts` only; mock and (later) HTTP clients are interchangeable adapters. Class talking points and ML roadmap: **`../README.md`**.

## Scripts

- `npm run dev` — Vite dev server  
- `npm run build` — production build (runs `tsc` + Vite)  
- `npm run lint` — ESLint  

## Mock API and Dev mode

- **API entry:** `src/services/api/nextplayApi.ts`  
  - Exports **`USES_MOCK_BACKEND`** (`true` until you wire real HTTP clients).  
  - Re-exports mock implementations from `src/services/mocks/mockNextPlayApi.ts`.

- **Dev mode:** use the header toggle. Persists as `localStorage` key **`nextplay.devMode`** (`'1'` on, `'0'` off).  
  When **on**, you get demo conveniences (state shortcuts, role bypass, synthetic season rows for empty shells). When **off**, the app stays “prototype-shaped” without that extra fill behavior.

## Scoring UI (product story)

- **Player:** stat lines with **quantity × rate → fantasy points**; detail fetch includes breakdown.  
- **Team:** starter table sums to **team score (starters)**; expanded rows match **Matchups** projected side in the mock.  
- **Matchup details:** `getMatchupLineupScoring` drives home/away columns (same breakdown panels as Team).  

## Backend swap

Replace mock exports in `src/services/api/nextplayApi.ts` with your HTTP client; keep types in `src/types/models.ts` aligned (or version them).

## Lint / build

From this directory: `npm run lint`, `npm run build`.

CI runs the same on GitHub — see **[`../docs/TESTING.md`](../docs/TESTING.md)** and **[`../.github/workflows/ci.yml`](../.github/workflows/ci.yml)**.
