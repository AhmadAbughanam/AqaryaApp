## 2024-11-20 - Global cached Intl formatters

**Learning:** When refactoring inline `Intl.NumberFormat` formatters using automated regex scripts, replacing inline wrappers completely and caching them prevents performance bottlenecks and garbage collection overheads during React list renders. Self-referencing wrapper bugs (e.g. `const formatCurrency = (v) => formatCurrency(v)`) must be carefully avoided by ensuring wrappers are fully wiped out and imports are handled correctly.
**Action:** When performing global regex refactoring in React Native components, proactively examine diffs to catch residual wrapper configurations and verify that variables aren't implicitly shadowed.
