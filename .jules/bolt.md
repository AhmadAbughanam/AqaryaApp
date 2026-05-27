
## 2024-05-27 - [Cached Intl Formatters]
**Learning:** Instantiating `Intl.NumberFormat` and `Intl.DateTimeFormat` inside React render cycles or frequently called utility functions creates significant, measurable performance overhead across the codebase due to the expense of the `Intl` constructors in JavaScript.
**Action:** Always utilize cached instances of `Intl` formatters (e.g., from `src/utils/formatters.ts`) instead of creating inline instances `new Intl.NumberFormat(...)` on every call. Added `formatNumber`, `formatCurrency`, `formatDecimals2`, etc., and centralized date/number formatting caching.
