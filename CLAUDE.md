@./CONTEXT.md
@./MEMORY.md

# Claude Workspace Guide

## Project
- Name: `AqaryaApp`
- Product: property platform with citizen and admin flows
- Frontend: React Native mobile app in the repo root
- Backend: NestJS + Prisma + PostgreSQL service in `backend/`
- Package manager: `npm`

## Domain Summary
- Citizens can browse properties, buy sale listings, simulate investments, invest in fractional projects, and manage owned property flows.
- Admin users handle verification, audit logs, analytics, freezing, and blockchain anchoring workflows.
- The app has two main market modes:
  - `sale`: direct property sale lifecycle
  - `investment`: fractional investment lifecycle
- Core backend state is built around:
  - `UserRole`: `citizen`, `admin`
  - `PropertyStatus`: `pending_verification`, `verified`, `rejected`, `frozen`, `sold`
  - `VerificationStatus`: `pending`, `verified`, `rejected`
  - `MarketType`: `sale`, `investment`

## Main Stack
- React `19.1.0`
- React Native `0.81.5`
- TypeScript
- React Navigation native stack
- Axios API client
- AsyncStorage + secure token storage for auth persistence
- NestJS `11`
- Prisma `5` with PostgreSQL

## Important Paths
- `App.tsx`: app bootstrap, auth restore, unauthorized sign-out handling
- `src/navigation/AppNavigator.tsx`: top-level navigation and role routing
- `src/navigation/CitizenStack.tsx`: citizen flow
- `src/navigation/AdminStack.tsx`: admin flow
- `src/store/AuthContext.tsx`: auth context contract
- `src/config/api.ts`: frontend API base URL logic
- `src/api/`: mobile API contracts
- `src/screens/citizen/`: citizen property, sale, portfolio, and investment flows
- `src/screens/dlsAdmin/`: admin verification, analytics, and audit flows
- `src/constants/strings.ts`: user-facing copy
- `src/constants/colors.ts`: visual tokens
- `backend/src/auth/`: auth endpoints and JWT strategy
- `backend/src/properties/`: listing, detail, and purchase flows
- `backend/src/investments/`: simulation and investment flows
- `backend/src/admin/`: admin review and audit actions
- `backend/src/verification/`: verification logic
- `backend/src/analytics/`: analytics aggregation
- `backend/prisma/schema.prisma`: canonical data model
- `backend/test/`: backend e2e coverage

## Current Project Conventions
- Prefer small, direct edits over broad refactors.
- Match nearby code style and naming before introducing new patterns.
- Keep frontend text in `src/constants/strings.ts` when it is reusable or user-facing.
- Reuse shared UI building blocks from `src/components/` before creating new component primitives.
- Reuse helpers in `src/utils/`, `src/hooks/`, and `src/services/` before duplicating logic.
- Avoid adding dependencies unless the task clearly requires them.
- Do not edit generated output in `backend/dist/`; change source files under `backend/src/` instead.

## Auth And Role Rules
- Auth state depends on both the secure token and the persisted role.
- When changing sign-in or sign-out behavior, keep these in sync:
  - `App.tsx`
  - `src/store/AuthContext.tsx`
  - `src/services/secureStorage.ts`
  - `src/api/auth.ts`
  - `src/api/client.ts`
- Unauthorized API handling signs the user out globally; avoid local workarounds that bypass this flow.
- Navigation is role-based. If a new screen depends on role access, update both route typing and the correct stack.

## API And Environment Notes
- Frontend default dev API base URL is `http://10.0.2.2:3000` for the Android emulator.
- Production base URL is still a placeholder in `src/config/api.ts`.
- If an API contract changes, update the matching frontend client types and backend DTO/service/controller together.
- Do not hardcode secrets or environment values into source files.

## Property Workflow Rules
- Sale and investment flows are different products. Do not blur them.
- `sale` properties can be bought directly.
- `investment` properties are used for simulation and share-based investing.
- Verification and listing state changes usually affect:
  - backend Prisma schema and service logic
  - frontend status badges and screen copy
  - admin actions and audit metadata
- When changing listing lifecycle logic, inspect these areas together:
  - `backend/src/properties/`
  - `backend/src/admin/`
  - `backend/src/verification/`
  - `src/api/properties.ts`
  - `src/api/admin.ts`
  - `src/components/StatusBadge.tsx`
  - affected citizen/admin screens

## Investment Workflow Rules
- Simulation math and investment execution live in `backend/src/investments/`.
- Frontend simulation screens should stay consistent with backend-calculated values.
- If you change fees, returns, ownership percentages, or share rules, update both the API types and the UI labels/messages.

## UI Guidance
- Preserve the current product look unless the task explicitly asks for redesign.
- The app already uses a branded, polished style rather than default React Native UI.
- Keep accessibility labels intact when updating buttons, icons, or modal controls.
- Be careful with copy changes because strings are centralized and some text is domain-specific to SANAD, verification, and property workflows.

## Backend Guidance
- Prefer changing NestJS source modules and Prisma schema rather than patching test fixtures alone.
- Keep DTO validation aligned with service expectations.
- When schema changes are required, update:
  - `backend/prisma/schema.prisma`
  - migrations if needed
  - seed data when necessary
  - affected e2e tests
- Use existing audit logging patterns when adding admin or lifecycle actions.

## Commands
- Root install: `npm install`
- Start Metro: `npm run start`
- Run Android app: `npm run android`
- Run iOS app: `npm run ios`
- Backend install: `npm install` in `backend/`
- Backend dev server: `npm run start:dev` in `backend/`
- Backend e2e tests: `npm run test:e2e` in `backend/`
- Prisma generate: `npm run prisma:generate` in `backend/`
- Prisma migrate: `npm run prisma:migrate` in `backend/`
- Prisma seed: `npm run prisma:seed` in `backend/`

## How Claude Should Work In This Repo
- Read the nearest related files first and match existing patterns.
- Solve the smallest correct surface that addresses the real bug or feature.
- If a change crosses mobile and backend boundaries, keep the contract aligned in the same pass.
- For role, property status, verification, or investment changes, check for downstream UI and audit implications before finishing.
- Prefer updating existing tests over adding speculative new infrastructure.

## Validation
- Run the smallest relevant verification for the touched area.
- For mobile-only changes, at least sanity-check imports, route params, types, and affected screen flows.
- For backend logic changes, prefer `backend` e2e tests when relevant.
- If you cannot run a full validation step, explicitly note what was not verified.
