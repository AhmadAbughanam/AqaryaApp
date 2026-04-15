# AqaryaApp - Aqarya

Aqarya is a bilingual trusted digital property service concept for Jordan, prepared for the Crown Prince Award for Best Government Services Application.

The project is framed as a government-service app, not just a private real-estate marketplace. It demonstrates how citizens could buy, rent, sell, and evaluate property through SANAD-style identity, DLS-style property verification, admin oversight, notifications, audit logs, and blockchain-backed verification records.

> Integration note: this demo uses SANAD-style and DLS-style workflows to show integration readiness. Do not claim live production integration with SANAD or the Department of Lands and Survey unless official APIs are later connected.

## Crown Prince Award Submission

For competition use, lead with the government-service value:

- **Citizen trust:** verified property records, identity-aware workflows, and clear status updates.
- **Government oversight:** admin review queues, provider verification, moderation, audit logs, and analytics.
- **Transparency:** blockchain-backed verification references and tamper-evident audit trails.
- **Accessibility:** Arabic/English support and mobile-first citizen journeys.
- **Scalability:** full-stack architecture with Prisma migrations, seed data, and backend e2e coverage.

Competition documentation lives in `docs/`:

- `docs/PROJECT_STRUCTURE.md` - source layout and ownership rules.
- `docs/ASSET_GUIDE.md` - local image registry, naming, and asset-update rules.
- `docs/ENVIRONMENT.md` - local backend/mobile setup and environment values.
- `docs/GITHUB_RELEASE_CHECKLIST.md` - pre-push, secret-safety, APK, and smoke-test checklist.
- `docs/COMPETITION_SUBMISSION.md` - judge-facing project framing.
- `docs/DEMO_SCRIPT.md` - 2-minute and 5-minute demo paths.
- `docs/APK_BUILD_AND_SUBMISSION.md` - Android APK build and upload guide.
- `docs/COMPETITION_DEMO_CHECKLIST.md` - short pre-demo checklist.

APK files should be built locally and uploaded directly to the award website. Do not commit APKs, app bundles, keystores, or signing passwords to GitHub.

## Repository layout

```
AqaryaApp/
├── App.tsx                  # Root entry — auth bootstrap + global context
├── docs/                    # Competition, demo, and APK submission docs
├── src/
│   ├── api/                 # Frontend API clients (Axios-based)
│   ├── assets/              # Static images and central asset registry
│   │   └── images/index.ts  # AppImages map for all local image imports
│   ├── components/          # Reusable UI components
│   ├── constants/           # Shared colors, strings, route names
│   ├── hooks/               # Shared React hooks
│   ├── i18n/                # Language context + bilingual string hooks
│   ├── navigation/          # React Navigation stacks and tab navigators
│   ├── screens/
│   │   ├── citizen/         # Citizen-facing screens (home, portfolio, invest…)
│   │   └── dlsAdmin/        # Admin screens (verification, analytics, audit…)
│   ├── services/            # Secure storage, token helpers
│   ├── store/               # Auth context and state
│   ├── types/               # Shared TypeScript domain types
│   └── utils/               # Pure helper functions
└── backend/
    ├── prisma/
    │   ├── schema.prisma    # Canonical data model
    │   ├── migrations/      # Prisma migration history
    │   └── seed.ts          # Development seed data
    ├── src/
    │   ├── auth/            # JWT auth, guards, strategy
    │   ├── users/           # Profile, saved items, preferences, notifications
    │   ├── properties/      # Property CRUD and listing lifecycle
    │   ├── investments/      # Investment opportunities and simulations
    │   ├── messages/        # Conversation threads and messages
    │   ├── moderation/      # Reports, quality flags, moderation actions
    │   ├── audit/           # Audit log endpoints
    │   ├── analytics/       # Admin analytics aggregates
    │   ├── cms/             # Announcements and Help content blocks
    │   └── admin/           # Admin dashboard summary, verification, user mgmt
    └── test/                # Backend e2e tests (Supertest + Jest)
```

## Source organization rules

- Put reusable UI in `src/components/`.
- Put screen-specific code in `src/screens/<area>/`.
- Put typed API calls in the matching file under `src/api/`.
- Put route param types in the navigator that owns the route.
- Import local images from `src/assets/images/index.ts` via `AppImages`.
- Avoid direct image `require(...)` calls from screens and components.

See `docs/PROJECT_STRUCTURE.md` and `docs/ASSET_GUIDE.md` for the full conventions.

## GitHub and release readiness

Before pushing to GitHub or building an APK:

```powershell
npm run typecheck
git status --short
```

Do not commit generated APK/AAB files, keystores, `.env` files, database dumps, or signing credentials. See `docs/GITHUB_RELEASE_CHECKLIST.md` for the full release checklist.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.x LTS |
| npm | 10.x (bundled with Node 20) |
| PostgreSQL | 14+ |
| Android Studio / Xcode | for device/simulator builds |

## Quick start

### 1. Clone and install

```bash
git clone <repo-url> AqaryaApp
cd AqaryaApp
npm install
npm --prefix backend install
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and JWT_SECRET at minimum
```

Minimum required values in `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aqarya_dev?schema=public"
JWT_SECRET="replace-with-a-strong-random-secret"
```

### 3. Run database migrations and seed

```bash
# Apply all migrations
npm --prefix backend run prisma:migrate

# Seed development data (admin + citizen accounts, sample properties, etc.)
npm --prefix backend run prisma:seed
```

Seeded demo accounts:

### Citizen accounts

All citizen demo accounts use password `123456`.

| Username | Story | eJOD Balance |
|----------|-------|--------------|
| `omar_rashid` | Active owner + investor. Owns investment, sale, and rent properties. Deposited 30,000 JOD and invested 5,000 JOD. | 25,000 JOD |
| `lina_haddad` | Owner with investments. Irbid-focused properties. Deposited 10,000 JOD and invested 4,000 JOD. | 6,000 JOD |
| `rania_khouri` | Aqaba-focused owner. Deposited 15,000 JOD and invested 3,000 JOD. | 12,000 JOD |
| `tariq_nassar` | First-time investor. Has simulated Aqaba Marina Fund with 100 shares. No properties owned. | 5,000 JOD |
| `yousef_barakat` | Browser/buyer. Has simulated Madaba Growth Project with 80 shares. Saved searches are set up. | 12,000 JOD |

### Admin and other demo accounts

| Username | Password | Notes |
|----------|----------|-------|
| `admin` | `123456` | Admin account unchanged. |
| `owner1` | unchanged | Existing owner account unchanged. |
| `agency1` | unchanged | Existing agency account unchanged. |
| `dev1` | unchanged | Existing developer account unchanged. |
| `partner1` | unchanged | Existing partner account unchanged. |
| `individual1` | unchanged | Existing individual account unchanged. |
| `suspended1` | unchanged | Existing suspended account unchanged. |

### 4. Start the backend

```bash
# From the repo root
npm --prefix backend run start:dev
# API available at http://localhost:3000
```

### 5. Start the mobile app

```bash
# In the repo root
npm run start          # start Metro bundler

# In a second terminal
npm run android        # run on Android emulator / device
npm run ios            # run on iOS simulator (macOS + Xcode required)
```

## Android APK build for submission

See `docs/APK_BUILD_AND_SUBMISSION.md` for full details. Short version:

```powershell
cd android
.\gradlew assembleRelease
```

Expected release output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

For local testing only:

```powershell
cd android
.\gradlew assembleDebug
```

Expected debug output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Do not commit generated APK/AAB files, keystores, or signing credentials. Upload the APK directly to the competition website.

## Development commands

### Mobile (repo root)

| Command | Description |
|---------|-------------|
| `npm run start` | Start Metro bundler |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests |
| `npm run verify` | typecheck + lint + tests |

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with file-watch (hot-reload) |
| `npm run start` | Start without watch |
| `npm run build` | Compile TypeScript |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Apply pending migrations (dev) |
| `npm run prisma:deploy` | Apply migrations (production / CI) |
| `npm run prisma:seed` | Seed development data |
| `npm run test:e2e` | End-to-end tests (requires a running DB) |
| `npm run verify` | build + prisma:generate |

Shortcut aliases defined in the root `package.json`:

```bash
npm run backend:build
npm run backend:verify
npm run backend:test:e2e
```

## iOS setup (macOS only)

```bash
bundle install
bundle exec pod install --project-directory=ios
npm run ios
```

## Running e2e tests

The backend e2e suite requires a PostgreSQL database. Point `DATABASE_URL` at a **test database** (not dev), then:

```bash
npm --prefix backend run test:e2e
```

The global setup automatically runs `prisma db push` to sync the schema, then each suite seeds and resets its own data.

## Authentication flow

- Login returns a JWT stored in the device keychain (via `react-native-keychain`).
- The user role (`citizen` | `admin`) is stored in `AsyncStorage`.
- On boot, `App.tsx` reads both; if valid, the user lands in the appropriate navigator without a login prompt.
- All authenticated requests attach the JWT as a `Bearer` header via the Axios client in `src/api/client.ts`.
- A 401 response from the API automatically signs the user out.

## Project features

### Citizen flows
- **Intro + login** - government-service intro, Arabic/English toggle, and SANAD-style sign-in affordance
- **Buy / Rent** - browse verified sale and rental listings, save favourites, contact owners
- **Sell owned property** - submit citizen-owned property listings into a verification pipeline
- **Invest** - browse approved investment opportunities and simulate returns
- **My Properties / Portfolio** - owned properties, active investments, and portfolio value summary
- **Saved items** - bookmarked listings and opportunities with quick-access list
- **Saved searches** - named search presets persisted per account
- **Notifications** - in-app activity feed for listing status, investment milestones, messages, and system alerts
- **Preferences** - language (English / Arabic) and notification toggles
- **Help** - backend-managed onboarding guide explaining each journey

### Admin (DLS) flows
- **Dashboard** - summary KPIs for reviews, moderation, threads, announcements, providers, and audit activity
- **Verification queue** - review and approve/reject/freeze/request changes for property listing requests
- **Investment review** - approve, reject, publish, and unpublish investment opportunities
- **User management** - browse platform users and manage provider verification states
- **Audit log** - immutable activity trail filterable by entity and action
- **Analytics** - operational dashboard for property, investment, provider, moderation, messaging, and CMS metrics
- **Moderation queue** - review citizen reports on listings and opportunities, manage quality flags
- **Announcements** - broadcast system notifications to all citizens, all providers, or a specific user
- **Help content** - manage backend-owned content blocks displayed on the citizen Help screen

## Security notes

- `backend/.env` is git-ignored. Never commit credentials.
- APKs, app bundles, keystores, `.jks` files, and signing passwords must not be committed.
- JWT secrets must be long random strings in production.
- All request bodies are validated with `class-validator` DTOs before reaching service logic.
- User IDs, roles, and ownership are always resolved server-side from the verified JWT — never trusted from the request body.

## Known issues / Windows notes

- `prisma:generate` may throw an `EPERM` error on Windows when the IDE (VS Code Prisma extension) holds the engine DLL. This is non-blocking — the Prisma client is already up to date. Close the IDE extension or re-run after restarting VS Code if a fresh generate is required.
