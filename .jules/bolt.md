## 2024-06-19 - [Cache Intl Formatters]
**Learning:** Found that `Intl.NumberFormat` was being instantiated on every render inside multiple components across the application. This is a known performance bottleneck in JS environments since initializing Intl objects is an expensive operation.
**Action:** Next time, search for inline `Intl.DateTimeFormat` or `Intl.NumberFormat` usage as a low-hanging optimization target and move them to centralized cached instances instead.
