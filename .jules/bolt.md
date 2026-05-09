## 2024-03-XX - Missing getItemLayout on large list
**Learning:** React Native's `FlatList` can suffer from performance issues on long lists without `getItemLayout`.
**Action:** Always consider `getItemLayout` for `FlatList` where items have a fixed height to avoid dynamic measurement overhead.
## 2024-03-XX - Missing useCallback on FlatList renderItem
**Learning:** Functions created inline inside a component and passed to `FlatList`'s `renderItem` prop are recreated on every render of the parent component, causing all list items to re-render.
**Action:** Wrap `renderItem` functions in `useCallback` to ensure reference equality across renders, improving `FlatList` performance.
