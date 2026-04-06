---
name: deploy
description: Prepares AqaryaApp for a safe backend or mobile release without skipping required verification.
disable-model-invocation: true
---

Prepare AqaryaApp for release:

1. Confirm the release target: `backend`, `android`, or `ios`.
2. Require a clean working tree before any release step.
3. Run baseline verification:
   - `npm run verify`
   - `npm --prefix backend run verify` if backend code changed
4. For iOS release work, ensure `bundle install` and `bundle exec pod install --project-directory=ios` are current.
5. For backend release work, verify the migration and health-check plan without printing `.env` values.
6. Never push, publish, or deploy without explicit user confirmation.
7. End with:
   - what is verified
   - what is still blocked
   - the exact next command to run
