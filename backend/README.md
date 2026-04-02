# Aqarya Backend

NestJS + Prisma + PostgreSQL backend for the Aqarya mobile app.

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

## Setup

1. Copy and adjust environment values in `backend/.env`.
2. Install dependencies:
   - `npm install`
3. Generate Prisma client:
   - `npx prisma generate`
4. Apply migrations:
   - `npx prisma migrate dev`
5. Seed data:
   - `npx prisma db seed`
6. Start server:
   - `npm run start:dev`

Server runs at `http://localhost:3000` by default.

## Seed users

- `citizen / 123456`
- `admin / 123456`
- `dlsadmin / 123456`
- `auditor / 123456`
- `analyst / 123456`

## Health check

- `GET /health`
