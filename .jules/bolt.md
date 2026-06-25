
## 2024-05-18 - Cached Intl formatters
**Learning:** Instantiating `Intl.NumberFormat` and `Intl.DateTimeFormat` inside render loops creates a significant performance bottleneck in React Native applications due to the repeated JS thread overhead.
**Action:** Always extract `Intl` formatters into singleton utilities (e.g., `src/utils/formatters.ts`) and import them where needed. Ensure specialized configurations (like `notation: 'compact'`) are also preserved as distinct cached formatters to prevent UI regressions.
