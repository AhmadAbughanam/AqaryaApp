# Aqarya — demonstration build

Aqarya is presented here as a **digital trust and operations layer for property in Jordan**,
following the V4 concept document. It is not a classifieds marketplace, it never holds client
funds, and it is not an investment platform. Legal ownership, registration, and transfer stay
with the Department of Lands and Survey; Aqarya links to identity (SANAD) and the registry
through authorised integrations.

This repository is a **frontend-only demo**. There is no backend, database, or real login. All
data is mock data served from `src/mock/db.ts`; changes live in the browser tab and reset on
reload.

## What the demo shows

- **Two-button entry** — "Login with SANAD" opens the citizen app, "Admin access" opens the
  government operations console. No password.
- **Citizen app** is presented at mobile width only (a centered ~430px shell with a bottom tab
  bar): browse source-authenticated listings, open a property record, make a structured offer or
  request a structured rental contract, submit a listing for verification, messages, map,
  notifications, profile.
- **Admin console** (desktop layout): registry review with verify / request changes / reject /
  freeze, moderation queue, users & provider review, content, audit log, analytics, and an
  investment-governance view.

## Stack

React 19, TypeScript, React Router, Vite. No server.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Verify

```bash
npm run verify   # typecheck + lint + vitest + production build
```

## Layout

```text
src/
  api/        Typed clients — each resolves against the mock store, no network
  mock/db.ts  In-memory seed data + mutations for the whole demo
  assets/     Images
  i18n/       English / Arabic language state (RTL aware)
  store/      Auth = a role flag in localStorage
  web/        Layout, UI primitives, and pages
```
