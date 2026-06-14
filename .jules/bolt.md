
## 2024-05-18 - Cached Intl Formatters
**Learning:** Instantiating `Intl.NumberFormat` or `Intl.DateTimeFormat` inline within React components creates a performance bottleneck during React renders as they are expensive objects to construct.
**Action:** Use cached `Intl` formatters from `src/utils/formatters.ts` instead of inline instantiations to prevent performance bottlenecks.
