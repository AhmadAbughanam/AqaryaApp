## 2023-10-24 - [Intl Formatters Performance]
**Learning:** Recreating `Intl.NumberFormat` and `Intl.DateTimeFormat` objects inside React component render functions is a significant performance bottleneck in this codebase, causing unnecessary garbage collection and slower renders.
**Action:** Always use and add to the cached `Intl` formatters in `src/utils/formatters.ts` (e.g., `formatCurrency`, `formatDateTime`, `formatCompactCurrency`) instead of instantiating new formatters directly in components.
