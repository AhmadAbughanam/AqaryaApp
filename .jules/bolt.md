## 2024-05-18 - Cached Intl Formatters for Mobile Renders
**Learning:** Instantiating `Intl.NumberFormat` inside React Native render cycles or local wrapper functions creates unnecessary garbage collection overhead and potential frame drops on low-end devices, especially when formatting arrays of items (like transactions or portfolio listings).
**Action:** Extract formatters globally into cached instances inside `utils/formatters.ts` and directly export the bound `.format` method. Automatically refactor occurrences to utilize these singletons.
