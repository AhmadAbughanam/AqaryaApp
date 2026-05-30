## 2024-05-30 - Instantiate Intl formatters outside render loop
**Learning:** Instantiating `Intl.NumberFormat` or `Intl.DateTimeFormat` inline within React render methods or frequently called functions creates a performance bottleneck because the `Intl` API takes significant time to parse locales and options.
**Action:** Always create a single, shared instance of `Intl` formatters (e.g. in `src/utils/formatters.ts`) and export a wrapper function or use the instance directly to avoid re-instantiation.
