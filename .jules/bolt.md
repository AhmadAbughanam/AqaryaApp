## 2023-11-09 - [Inline Intl Instantiation Performance Bottleneck]
**Learning:** Instantiating `Intl.NumberFormat` or `Intl.DateTimeFormat` inline within React components creates significant performance bottlenecks during re-renders because `Intl` objects are expensive to initialize.
**Action:** Always extract and cache `Intl` formatters globally (e.g., in `src/utils/formatters.ts`) and import them, especially in high-frequency rendering contexts like lists or maps.
