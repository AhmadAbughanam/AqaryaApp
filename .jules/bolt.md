## 2025-02-13 - Cached Intl formatters
**Learning:** Instantiating `Intl.NumberFormat` on every component render inside helper functions (e.g., `const formatCurrency = ...`) introduces unnecessary performance overhead in React apps, especially on long lists and dashboards.
**Action:** Always export and utilize globally cached `Intl` formatter instances (using their bound `.format` methods) rather than recreating them during each render cycle.
