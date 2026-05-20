## 2024-05-24 - React Native Render Bottlenecks with Intl
**Learning:** Instantiating `Intl.NumberFormat` or `Intl.DateTimeFormat` inline inside React components is surprisingly expensive in React Native rendering loops, significantly dropping FPS when rendering large lists (like properties or wallet transactions).
**Action:** Always create `Intl` formatter instances globally or at the module level (e.g. in `src/utils/formatters.ts`) and export formatting functions to reuse these instances across all renders and components.
