## 2024-05-15 - Cached Intl formatters
**Learning:** `Intl` object initializations (`new Intl.DateTimeFormat`, `new Intl.NumberFormat`) are expensive in JavaScript and cause performance bottlenecks during React re-renders when created inline inside components.
**Action:** Always instantiate `Intl` formatters once in a shared utility file (e.g., `src/utils/formatters.ts`) and export cached formatting functions instead of creating them inline.
