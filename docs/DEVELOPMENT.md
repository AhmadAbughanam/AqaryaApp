# Development

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run typecheck` | Check browser TypeScript |
| `npm run lint` | Run frontend linting |
| `npm test` | Run frontend unit tests |
| `npm run build` | Create the production `dist/` bundle |
| `npm run verify` | Run all frontend checks |
| `npm --prefix backend run start:dev` | Start the API with reload |
| `npm run backend:verify` | Build the API and generate Prisma Client |

## Environment

Frontend builds use `VITE_API_BASE_URL`. It is optional because local development and the production Nginx image both use `/api`.

The API requires `DATABASE_URL` and `JWT_SECRET`. Optional API settings are documented in `backend/.env.example`.

## Business rules

Keep citizen and admin responsibilities separate. The frontend may display and request state changes, but ownership, wallet balances, verification, investment calculations, moderation decisions, and audit events must remain backend-controlled.
