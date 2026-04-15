# Project Structure

This document explains where app code belongs and how to keep the repository easy to maintain before publishing it to GitHub.

## Root Layout

```text
AqaryaApp/
├── App.tsx                  # Mobile app bootstrap, auth restore, global providers
├── index.js                 # React Native entry point
├── src/                     # Mobile app source
├── backend/                 # NestJS API, Prisma schema, migrations, backend tests
├── android/                 # Android native project and APK build output
├── ios/                     # iOS native project
├── docs/                    # Project, release, demo, and submission documentation
├── __tests__/               # Mobile Jest tests
├── package.json             # Root mobile scripts and shared tooling
└── README.md                # Main project guide
```

## Mobile Source Layout

```text
src/
├── api/                     # API clients and response types
├── assets/                  # Static app images and asset registry
├── components/              # Reusable UI components
├── config/                  # Runtime config such as API base URL
├── constants/               # Colors, copy constants, and shared values
├── hooks/                   # Reusable React hooks
├── i18n/                    # Language provider and localized strings
├── navigation/              # Stack/tab navigators and route param types
├── screens/                 # Feature screens grouped by user area
├── services/                # Device services such as secure token storage
├── store/                   # App-level contexts and small state stores
├── types/                   # Shared TypeScript domain types
└── utils/                   # Pure helper functions
```

## Screen Organization

Citizen screens live under `src/screens/citizen/`.

Admin/DLS screens live under `src/screens/dlsAdmin/`.

Authentication and onboarding screens live under `src/screens/auth/`.

Keep screen-specific styles inside the screen file unless a pattern is reused in several places. Move reused UI into `src/components/`, and move reused business logic into `src/hooks/`, `src/utils/`, or the relevant `src/api/` client.

## API Organization

Each file in `src/api/` owns one backend domain:

- `auth.ts` - login and auth types
- `client.ts` - shared authenticated Axios client
- `properties.ts` - property browsing, details, and listing actions
- `investmentOpportunities.ts` - opportunity browsing, details, and simulations
- `savedListings.ts` - saved listings, opportunities, and preferences
- `messages.ts` - threads and messages
- `notifications.ts` - notification feed
- `admin.ts` - admin/DLS operations

Add new endpoints to the closest existing domain file. Create a new API file only when a backend module has a separate domain.

## Navigation Organization

Route param types live with their navigator files in `src/navigation/`. This keeps navigation calls type-safe.

Use these conventions:

- Add a route to the stack that owns the screen.
- Export the stack param list from the navigator file.
- Pass typed route params when navigating to detail screens.
- Avoid cross-tab jumps unless the user is intentionally moving to another tab.

## Asset Organization

Static images are registered in:

```text
src/assets/images/index.ts
```

Screens and components should import `AppImages` instead of calling `require(...)` directly. This keeps Metro's static image requirements in one place and makes future asset moves safer.

See `docs/ASSET_GUIDE.md` for details.

## Backend Layout

The backend uses NestJS with Prisma:

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── admin/
│   ├── analytics/
│   ├── auth/
│   ├── cms/
│   ├── investments/
│   ├── messages/
│   ├── moderation/
│   ├── properties/
│   └── users/
└── test/
```

Keep DTO validation near the controller that receives the request. Keep database access inside services.

## Change Rules

- Keep asset imports centralized in `src/assets/images/index.ts`.
- Keep shared UI in `src/components/`; avoid copying card/header controls across screens.
- Keep API response types next to the API function that returns them.
- Do not commit APK files, keystores, `.env` files, or signing credentials.
- Run `npm run typecheck` before committing.
- Run focused lint on touched files if full lint has unrelated existing warnings.
