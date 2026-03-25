# NextPlay Frontend

Quick teammate note from me: this frontend is demo-ready for core flows and set up for backend API swap-in.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run lint` - run ESLint

## Demo Draft Controls

Set `VITE_DEMO_DRAFT_MODE=1` in `.env.local` to expose commissioner demo controls during draft:

- Skip current pick (auto-pick + mark team auto)
- Toggle on-clock team auto mode

You can also toggle in browser devtools with:

```js
localStorage.setItem('nextplay.demo.draftMode', '1')
```

Disable by removing the key or setting it to `'0'`.

## Backend Swap Point

When backend APIs are ready, replace mock exports in:

- `src/services/api/nextplayApi.ts`

Current source of truth for mock behavior:

- `src/services/mocks/mockNextPlayApi.ts`
