## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2024-05-20 - [Zustand Store Re-render Optimization in useActiveRecall and StudyPage]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. This causes the component using the hook to re-render whenever ANY property in the store changes, even properties it doesn't use. This is particularly problematic in hooks like `useActiveRecall` and components like `StudyPage` where the timer updates every second.
**Action:** Used fine-grained individual selectors (e.g., `const prop = useStudyStore(state => state.prop)`) instead of destructuring the store object (e.g., `const { prop } = useStudyStore()`) to prevent unnecessary component re-renders when other state in the store changes.

## 2024-05-31 - [Global Zustand Store Re-render Optimization in GlobalMentor and AuthStore]
**Learning:** We need to consistently apply the fine-grained individual selectors pattern to all Zustand stores to prevent unnecessary component re-renders when unrelated properties change. Global components like `AuthProvider`, `GlobalMentor`, and many dashboard pages were destructuring the entire store.
**Action:** Applied the pattern globally across `useAuthStore` and `useMentorStore`. For example, replacing `const { user, profile } = useAuthStore();` with `const user = useAuthStore((s) => s.user); const profile = useAuthStore((s) => s.profile);`. This prevents `GlobalMentor` and all dashboard components from re-rendering simply because unrelated store state changes.
