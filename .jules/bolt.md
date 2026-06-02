## 2025-02-15 - Cached Intl instances for performance
**Learning:** Instantiating `Intl.NumberFormat` and `Intl.DateTimeFormat` multiple times, especially inside list items and re-rendering React Native components, creates measurable performance overhead in JavaScript.
**Action:** Always prefer caching these instances. Extract `Intl` formats to a shared utility like `src/utils/formatters.ts` and export formatting helper functions. Avoid inline `new Intl.*` definitions inside UI components completely.
