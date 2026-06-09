## 2026-04-03 - Intl Formatter Initialization Bottleneck
**Learning:** Instantiating `Intl.NumberFormat` and `Intl.DateTimeFormat` inside React render functions or frequent loops creates a measurable performance bottleneck, as these objects are expensive to initialize.
**Action:** Always use statically cached, pre-instantiated formatter instances from `src/utils/formatters.ts` instead of recreating them inline.
