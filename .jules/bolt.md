## 2025-02-18 - Cached Intl.NumberFormat
**Learning:** `Intl.NumberFormat` instantiation is notoriously slow and should not be invoked repeatedly inside React render cycles or mapped arrays.
**Action:** Always extract `Intl` formatters into centralized, module-level cached utilities (`src/utils/formatters.ts`) and export their bound `.format` methods for components to share. When automated tools are used to replace wrappers globally, ensure unique local formatter variants (like those using `notation: 'compact'`) are extracted explicitly instead of mistakenly replaced by generic defaults.
