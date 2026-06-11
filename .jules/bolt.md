
## $(date +%Y-%m-%d) - Cached Intl Formatters
**Learning:** `Intl.NumberFormat` instances are extremely slow to initialize and were being created repeatedly inside React render cycles throughout the application (e.g., `src/components/InvestmentSummaryCard.tsx`). Blindly replacing them via regex can cause formatting regressions (like losing `notation: 'compact'`) if edge cases aren't manually verified.
**Action:** When refactoring inline initializations (like formatters) to use a cached shared version, always manually check the removed inline parameters to ensure a matching shared version exists, rather than forcing all usages into a single generic formatter.
