# GitHub And Release Checklist

Use this checklist before pushing the project to GitHub or generating an APK for submission.

## Before Committing

Run:

```powershell
npm run typecheck
```

Recommended when time allows:

```powershell
npm test
npm --prefix backend run build
npm --prefix backend run prisma:generate
```

If backend e2e tests are required, use a test database:

```powershell
npm --prefix backend run test:e2e
```

## Review Git Status

```powershell
git status --short
```

Check that these are not staged:

- `backend/.env`
- `.env`
- `.env.local`
- APK/AAB files
- keystores
- signing passwords
- local IDE files
- database dumps
- raw design archives

## Secret Safety

Do not commit:

- `DATABASE_URL`
- `JWT_SECRET`
- API keys
- production URLs that should stay private
- Gradle signing passwords
- `.jks` or `.keystore` files

The repository `.gitignore` already excludes the common secret and build output files. Still review staged files manually before pushing.

## Asset Safety

Use `src/assets/images/index.ts` for image references. Avoid adding new direct `require('../../assets/images/...')` calls in screens.

Before pushing, search for direct image imports:

```powershell
rg "require\\([^\\n]*assets/images|assets/images" src
```

Direct requires should normally appear only in `src/assets/images/index.ts` and legacy compatibility registries.

## Android APK Build

Debug APK:

```powershell
cd android
.\gradlew assembleDebug
```

Release APK:

```powershell
cd android
.\gradlew assembleRelease
```

Release output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Do not commit the APK. Upload it directly to the submission website or attach it to a GitHub Release if needed.

## Manual Smoke Test

Before shipping an APK, test these flows:

- App launches without a blank screen.
- Login works for `citizen` and `admin`.
- Citizen can switch Buy, Rent, and Invest.
- Map opens and cards can navigate to detail pages.
- Investment detail pages keep the dark bottom nav.
- Saved items can be toggled.
- Profile page opens.
- Admin dashboard opens.
- Backend unavailable state is understandable.

## Suggested GitHub Repository Description

```text
Aqarya - React Native and NestJS property service demo for verified buy, rent, sell, and investment journeys in Jordan.
```

## Suggested Topics

```text
react-native
nestjs
prisma
postgresql
typescript
property-tech
government-services
jordan
mobile-app
android
```
