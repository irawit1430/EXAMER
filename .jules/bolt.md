## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2026-04-23 - [Optimize Dashboard Analytics with Concurrent Fetching]
**Learning:** Sequential Firestore fetching for independent data sections (e.g., progress stats vs. study sessions) can significantly inflate perceived latency. When building aggregated analytics endpoints, such operations often mistakenly execute in series due to unoptimized `await` chaining.
**Action:** Always identify independent database fetch routines in aggregation functions and execute them concurrently via `Promise.all` to compress total response time.
