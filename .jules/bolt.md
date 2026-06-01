## 2024-06-01 - [Cache Intl Formatters]
**Learning:** Instantiating `Intl.NumberFormat` and `Intl.DateTimeFormat` during React renders is a significant performance bottleneck as these API calls are expensive.
**Action:** Always use pre-instantiated, cached `Intl` formatters (e.g., from `src/utils/formatters.ts`) instead of creating new ones inline within components or loops to prevent unnecessary performance degradation.
