## 2024-05-24 - [Intl Formatters Re-instantiation Overhead]
**Learning:** React renders can be severely impacted by inline `Intl.NumberFormat` and `Intl.DateTimeFormat` instantiations, which are expensive operations. We identified over a dozen instances where these formatters were created inside render cycles.
**Action:** Always export and reuse singletons (cached instances) of `Intl` formatters from `src/utils/formatters.ts` across the application. Check for new inline usages during code reviews.
