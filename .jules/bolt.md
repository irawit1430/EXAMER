## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.
## 2024-05-24 - Parallelize independent data fetches in Firebase
**Learning:** Sequential await calls for independent Firebase reads (like `getProgressStats` and `getTodaysStudySessions`) artificially inflate query latency.
**Action:** When aggregating multiple metrics for dashboard or user views, bundle independent promises using `Promise.all` instead of executing them sequentially.
