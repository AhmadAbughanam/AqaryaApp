# Aqarya repository guide

Aqarya is a **frontend-only React/Vite demo** — no backend, no database, no real auth.

- Frontend entry: `src/main.tsx`
- Routes: `src/App.tsx`
- Browser UI: `src/web/`
- API clients: `src/api/` — every function resolves against the mock store, never the network
- Mock data + mutations: `src/mock/db.ts`
- Auth: `src/store/AuthContext.tsx` — a `citizen | admin` role flag in `localStorage`

Product framing follows the V4 concept doc: a digital trust/operations layer over property in
Jordan. Aqarya never holds funds, is not an investment platform, and does not replace the land
registry. Keep the citizen app mobile-width; the admin console may stay desktop-width.

Use strict TypeScript. Run `npm run verify` (typecheck + lint + test + build) before release.
