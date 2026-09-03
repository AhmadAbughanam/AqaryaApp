# Architecture

## Request flow

The browser loads the Vite production bundle from Nginx. Frontend requests use the relative `/api` base URL. Nginx removes that prefix and proxies the request to the NestJS service on the private Compose network. NestJS validates DTOs, authorizes JWT roles, applies domain rules, and reads or writes PostgreSQL through Prisma.

```text
Browser → Nginx (:80/:443) → /api proxy → NestJS (:3000) → Prisma → PostgreSQL
        ↘ static React SPA
```

## Frontend

- `src/App.tsx` owns protected citizen and admin routes.
- `src/web/Layout.tsx` provides responsive navigation for both roles.
- `src/web/pages/` contains browser-native pages and workflow actions.
- `src/api/` contains the typed Axios contracts shared by the pages.
- `src/store/AuthContext.tsx` owns JWT/role state. Session storage is the default; “keep me signed in” uses local storage.
- `src/config/api.ts` reads `VITE_API_BASE_URL`, defaulting to `/api`.

## Backend

The NestJS modules are organized by business capability: auth, properties, investments, wallet, users, messages, moderation, CMS, audit, analytics, verification, and admin operations. The backend remains the source of truth for status changes and calculations.

## Security boundaries

- Admin pages and admin controllers require the admin role.
- DTO validation strips unknown input and rejects non-whitelisted fields.
- The API has Helmet headers, explicit CORS configuration, proxy trust configuration, and graceful shutdown hooks.
- Nginx hides server tokens, adds browser security headers, and keeps PostgreSQL/API ports private by default.
