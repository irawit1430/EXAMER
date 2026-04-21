## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2026-04-21 - [Concurrent Firestore Aggregation]
**Learning:** To reduce latency in Firestore data aggregation logic (e.g., `getDashboardStats` in `src/lib/firebase/firestore.ts`), independent asynchronous fetching calls should be executed concurrently using `Promise.all` rather than sequentially.
**Action:** Always wrap independent async API/Firestore calls in `Promise.all` to ensure concurrent execution and minimize total wait time.
