## 2024-06-25 - Expensive Intl Operations React Native
**Learning:** `Intl` object instantiations (like `new Intl.NumberFormat` or `new Intl.DateTimeFormat`) are expensive operations. When used inline within React components, they can be created on every render cycle, leading to performance bottlenecks, particularly in large lists or frequently re-rendered screens.
**Action:** Always pre-instantiate and cache `Intl` formatters in a shared utility file (like `src/utils/formatters.ts`) and export helper functions that reuse these instances.
