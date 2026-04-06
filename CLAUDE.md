# CLAUDE.md — AqaryaApp Project Brain

## What This Is
- AqaryaApp is a property platform for citizens buying, listing, and investing in properties, plus admins handling verification, audit, and analytics flows.
- The repo contains a React Native mobile app at the root and a NestJS + Prisma backend in `backend/`.

## Tech Stack
- Mobile: React `19.1.0`, React Native `0.81.5`, TypeScript, React Navigation native stack
- Client state and storage: Context + local slices, AsyncStorage, react-native-keychain
- API client: Axios
- Backend: NestJS `11`, Prisma `5`, PostgreSQL
- Tooling: npm, Jest, ESLint, CocoaPods, Ruby Bundler
- Runtime: Node `20.19.4+`

## Folder Structure
- `src/navigation/` → top-level routing and citizen/admin stacks
- `src/screens/citizen/` → citizen property, portfolio, and investment flows
- `src/screens/dlsAdmin/` → admin verification, analytics, audit, and detail screens
- `src/api/` → frontend API contracts
- `src/store/` and `src/services/` → auth persistence, storage, and app services
- `src/constants/` → reusable strings, colors, and routes
- `backend/src/` → NestJS modules, DTOs, services, guards, and controllers
- `backend/prisma/schema.prisma` → canonical data model
- `backend/test/` → backend e2e coverage

## Commands
- `source ~/.nvm/nvm.sh && nvm use` → use the required Node version
- `npm install` → install mobile/root dependencies
- `npm run start` → start Metro
- `npm run android` → run Android app
- `npm run ios` → run iOS app
- `npm run typecheck` → root TypeScript check
- `npm run lint` → root ESLint check
- `npm test` → root Jest tests without Watchman
- `npm run verify` → root typecheck + lint + tests
- `npm --prefix backend install` → install backend dependencies
- `npm --prefix backend run build` → backend compile check
- `npm --prefix backend run prisma:generate` → generate Prisma client
- `npm --prefix backend run test:e2e` → backend e2e tests, requires database setup
- `npm --prefix backend run verify` → backend build + Prisma generate
- `bundle install` → install iOS Ruby gems
- `bundle exec pod install --project-directory=ios` → install iOS pods, requires full Xcode
- `./.claude/hooks/install-git-hooks.sh` → install the project pre-commit hook in a real git checkout

## Non-Negotiable Coding Rules
- Strict TypeScript only. No `any` and no blind `as` casts.
- Functional React components and hooks only.
- Reuse existing components, helpers, and services before adding new abstractions.
- Keep `sale` and `investment` flows separate across UI, API, and backend logic.
- If auth changes, keep `App.tsx`, `src/store/AuthContext.tsx`, `src/services/secureStorage.ts`, `src/api/auth.ts`, and `src/api/client.ts` aligned.
- If an API contract changes, update the matching frontend client, DTO, service, and Prisma usage in the same pass.
- Fix root causes. Do not suppress errors, add empty catches, or ship placeholder logic.

## Git Rules
- Never push unless the user explicitly asks.
- Use a feature branch for changes touching 8 or more files.
- Run the relevant verification before commit or review.
- Some exported copies of this repo do not include `.git`; use the real git checkout for git and `gh` workflows.

## Security Rules
- Never read `.env` files or hardcode secrets, tokens, or production URLs.
- Validate backend request input with DTOs and `class-validator` before service logic.
- Never trust client-supplied user IDs, roles, ownership flags, or status transitions.
- Do not expose stack traces, Prisma internals, tokens, or PII in API responses.
