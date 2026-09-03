# Aqarya Web Platform

Aqarya is a bilingual property-services platform for Jordan. It combines a responsive citizen marketplace with a government operations console for property verification, investment review, moderation, audit history, messaging, and content management.

This repository is a web application. The former React Native, Android, iOS, Metro, and mobile-navigation code has been removed.

## Stack

- React 19, TypeScript, React Router, and Vite
- NestJS 11 REST API
- Prisma and PostgreSQL
- Nginx reverse proxy
- Docker Compose deployment for a VPS

## Repository layout

```text
src/
  api/                 Typed browser API clients
  assets/              Web image assets
  i18n/                English/Arabic language state
  store/               Authentication state
  web/                 Layouts, UI primitives, and pages
backend/
  prisma/              Schema, migrations, seed, admin bootstrap
  src/                 NestJS API modules
Dockerfile             Frontend production image
docker-compose.yml     Web + API + PostgreSQL stack
nginx.conf             SPA hosting and /api reverse proxy
```

## Local development

Requirements: Node.js 20.19+ (or 22.12+), npm, and PostgreSQL 14+.

```bash
npm install
npm --prefix backend install
cp backend/.env.example backend/.env
```

Set `DATABASE_URL` and a strong `JWT_SECRET` in `backend/.env`, then prepare the database:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:seed
```

Run the API and web app in separate terminals:

```bash
npm --prefix backend run start:dev
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:3000`.

## Verification

```bash
npm run verify
npm run backend:verify
```

Backend end-to-end tests require a reachable test PostgreSQL database:

```bash
npm run backend:test:e2e
```

## VPS deployment

```bash
cp .env.vps.example .env
# Replace every placeholder in .env with strong production values.
docker compose up -d --build
docker compose exec backend npm run admin:bootstrap
```

The web container listens only on `127.0.0.1:HTTP_PORT` (default `8081`), allowing it to run beside an existing VPS project. The host reverse proxy keeps ownership of public ports `80` and `443`. The container Nginx serves the SPA and forwards `/api/*` to the internal API. Prisma migrations run whenever the API container starts; demo seed data is never loaded automatically.

For HTTPS, backups, upgrades, firewall guidance, and health checks, see [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md).

## Production notes

- The API refuses to start without `JWT_SECRET`.
- Use the included admin bootstrap command instead of loading demo users in production.
- The verification service remains in mock mode until an official provider is configured; do not present it as a live government or blockchain integration.
- Keep `.env`, database dumps, TLS private keys, and credentials out of Git.
