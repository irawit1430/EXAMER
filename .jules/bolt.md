# Performance Learnings

- When modifying React components, extracting invariant heavy data transformations to `useMemo` hooks significantly improves component update performance compared to re-evaluating deep nested loops on every re-render (e.g., when mapping static `syllabusTree` items).
- Flattening nested tree structures (`O(N)`) once and caching the result reduces the operational complexity in subsequent passes, especially when mapping external dynamic state (like progress updates) against the tree items.
