## 2024-03-24 - Unnecessary re-renders via Zustand hook
**Learning:** Destructuring the `useMentorStore()` object causes severe re-render bottlenecks because components trigger on every update of `streamBuffer`, which continuously changes during AI streaming.
**Action:** Always use fine-grained individual selectors when accessing Zustand stores (e.g., `const prop = useMentorStore(state => state.prop)`) instead of destructuring the hook result (e.g., `const { prop } = useMentorStore()`).
