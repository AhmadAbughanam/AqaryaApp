# Aqarya repository guide

Aqarya is a React/Vite web application with a NestJS/Prisma/PostgreSQL backend.

- Frontend entry: `src/main.tsx`
- Routes: `src/App.tsx`
- Browser UI: `src/web/`
- API clients: `src/api/`
- Backend: `backend/src/`
- Database: `backend/prisma/schema.prisma`
- VPS deployment: `docker-compose.yml` and `docs/VPS_DEPLOYMENT.md`

Use strict TypeScript. Keep business rules in the backend, preserve citizen/admin role boundaries, and run `npm run verify` plus `npm run backend:verify` before release.
