---
paths:
  - "App.tsx"
  - "src/**/*.tsx"
  - "src/navigation/**"
  - "src/api/**"
  - "src/store/**"
  - "src/services/**"
---

# AqaryaApp Frontend Rules

## Architecture
- Functional components and hooks only.
- Reuse shared UI from `src/components/` before creating new primitives.
- Reuse existing helpers from `src/api/`, `src/services/`, `src/hooks/`, and `src/utils/`.
- Keep user-facing copy in `src/constants/strings.ts` when the string is shared or product-facing.

## Styling
- Match the existing React Native design language built on `src/constants/colors.ts`.
- Prefer `StyleSheet.create` for shared styles.
- Avoid large inline style objects unless values are truly dynamic.
- Preserve the current polished, branded look unless the task explicitly asks for a redesign.

## Navigation and auth
- Update route types and the correct stack whenever a new screen or route param is introduced.
- Auth changes must keep the token, persisted role, and unauthorized sign-out flow aligned.
- Do not bypass the shared API client or secure storage helpers.

## UX and accessibility
- Keep accessibility labels and roles intact on buttons, modals, and icon-only controls.
- Provide loading, empty, and error states for async screens.
- Do not blur `sale` and `investment` user journeys.

## Performance
- Prefer `FlatList` or other list virtualization for long collections.
- Avoid expensive work in render paths.
- Do not add new dependencies unless the task clearly needs them.
