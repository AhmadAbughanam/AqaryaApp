
## 2023-10-27 - [Instantiating Intl objects in React list views]
**Learning:** Initializing `Intl.NumberFormat` or `Intl.DateTimeFormat` inside a component's render function—especially within components used in FlatLists (like `PortfolioCard` and `InvestmentCard`)—causes severe performance degradation due to the overhead of recreating the formatter for every list item.
**Action:** Always cache `Intl` formatter instances at the module level (e.g. in `src/utils/formatters.ts`) and reuse them across the application to prevent unnecessary instantiations during renders.
