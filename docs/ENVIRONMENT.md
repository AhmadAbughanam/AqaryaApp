# Environment Setup

This document lists the local environment values needed to run the app and backend.

## Required Tools

- Node.js 20.x
- npm 10.x
- PostgreSQL 14+
- Android Studio for Android emulator and APK builds
- Java/JDK compatible with the installed Android Gradle plugin
- Xcode and CocoaPods for iOS builds on macOS

## Install Dependencies

From the repository root:

```powershell
npm install
npm --prefix backend install
```

## Backend Environment

Create a local backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Minimum values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aqarya_dev?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
```

Never commit `backend/.env`.

## Database Setup

```powershell
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:seed
```

Seeded development users:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `123456` | admin |
| `citizen` | `123456` | citizen |
| `citizen2` | `123456` | citizen |
| `citizen3` | `123456` | citizen |

## Start Backend

```powershell
npm --prefix backend run start:dev
```

Default local API:

```text
http://localhost:3000
```

Android emulator access normally uses:

```text
http://10.0.2.2:3000
```

Check `src/config/api.ts` before building an APK for a physical phone. The APK must point to a backend URL that the phone can reach.

## Start Mobile App

Terminal 1:

```powershell
npm run start
```

Terminal 2:

```powershell
npm run android
```

## Verification Commands

```powershell
npm run typecheck
npm test
```

Full lint can be run with:

```powershell
npm run lint
```

If full lint reports older unrelated warnings, run focused lint on the files you changed.
