## 2026-06-23 - [Extract Intl Formatters to Prevent Re-renders]
**Learning:** Found multiple instances of `new Intl.NumberFormat()` inside React render paths (e.g., PortfolioCard.tsx, InvestmentCard.tsx, etc). This recreates the formatter object on every render, which is a known React Native performance bottleneck.
**Action:** Extract formatters to a shared module (like `src/utils/formatters.ts`) to cache them and reuse them across components, preventing unnecessary memory allocation and garbage collection during renders.
