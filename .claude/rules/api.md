---
paths:
  - "backend/src/**"
---

# AqaryaApp Backend API Rules

## Contracts
- Keep controller, DTO, service, and frontend client contracts aligned.
- Validate request bodies and params before service logic runs.
- If an API response shape changes, update the matching frontend client types in the same pass.

## Auth and authorization
- Protected routes must rely on guards and server-derived identity.
- Never trust client-supplied roles, user IDs, ownership flags, or status values.
- Admin-only actions must enforce role checks and preserve audit behavior.

## Error handling
- Return safe, consistent errors.
- Do not leak stack traces, SQL messages, tokens, or internal Prisma details to clients.
- Keep logging useful without printing secrets or personal data.

## Domain rules
- Preserve the separation between `sale` and `investment` flows.
- Verification and purchase state transitions must be enforced server-side.
- When lifecycle rules change, inspect downstream admin, analytics, and frontend effects.
