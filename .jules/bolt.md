## 2024-05-21 - Caching Intl Formatters to Prevent Render Blocking
**Learning:** Instantiating `Intl.NumberFormat` or `Intl.DateTimeFormat` during React renders causes unnecessary memory allocation and CPU overhead, acting as a performance bottleneck that can block the UI thread, particularly in long lists or frequently re-rendered components.
**Action:** Always cache and reuse `Intl` formatter instances in `src/utils/formatters.ts` rather than recreating them inline on every call.
