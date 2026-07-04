## 2025-03-08 - Optimize Intl.NumberFormat Instantiation
**Learning:** Instantiating `Intl.NumberFormat` repeatedly inside React components (or inline inside map functions and loops) is a significant performance bottleneck that causes unnecessary object creation during re-renders, dropping frame rates.
**Action:** Always extract `Intl` API instantiations into cached singleton instances and export the bound `.format` method from a shared utils file. Use these cached methods across the app to reduce garbage collection overhead and improve React performance.
