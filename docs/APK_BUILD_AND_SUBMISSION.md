# APK Build And Submission Guide

## Purpose

Use this guide to build an Android APK locally and upload it to the Crown Prince Award submission website. Do not commit APK files or signing credentials to GitHub.

## Prerequisites

- Node.js 20.x
- npm 10.x
- Android Studio with Android SDK installed
- Java/JDK compatible with the installed React Native/Gradle setup
- Project dependencies installed:

```powershell
npm install
npm --prefix backend install
```

## Backend / API Note For Demo Builds

For Android emulator development, the app uses the emulator host URL pattern:

```text
http://10.0.2.2:3000
```

For a real phone or release/demo APK outside the emulator, confirm the mobile app points to a reachable backend API URL. Do not hardcode secrets or production credentials into the app.

## Debug APK

From the repo root:

```powershell
cd android
.\gradlew assembleDebug
```

Expected output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Use the debug APK only for local testing unless the competition explicitly accepts debug builds.

## Release APK

From the repo root:

```powershell
cd android
.\gradlew assembleRelease
```

Expected output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Release Signing Notes

The current Android release build configuration in `android/app/build.gradle` expects these Gradle properties:

```text
AQARYA_RELEASE_STORE_FILE
AQARYA_RELEASE_STORE_PASSWORD
AQARYA_RELEASE_KEY_ALIAS
AQARYA_RELEASE_KEY_PASSWORD
```

Keep these values local. Good places for local signing values include:

- User-level Gradle properties, such as `%USERPROFILE%\.gradle\gradle.properties`
- CI/CD secret variables if you later automate builds

Do not put real signing passwords or keystore paths in GitHub documentation, screenshots, or committed files.

Example placeholder only:

```properties
AQARYA_RELEASE_STORE_FILE=aqarya-release.jks
AQARYA_RELEASE_STORE_PASSWORD=replace-me
AQARYA_RELEASE_KEY_ALIAS=aqarya
AQARYA_RELEASE_KEY_PASSWORD=replace-me
```

If the release keystore is stored under `android/app/`, make sure the `.jks` or `.keystore` file is not committed.

## What To Upload

Upload the generated APK file to the Crown Prince Award submission website:

```text
android/app/build/outputs/apk/release/app-release.apk
```

If a release build is not ready and the site accepts debug builds, use:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## What Not To Commit

Do not commit:

- `.apk`
- `.aab`
- `.apks`
- `.jks`
- `.keystore`
- `backend/.env`
- signing passwords
- local API secrets

If the APK must be shared from GitHub, use a GitHub Release asset rather than committing it as a normal repository file.
