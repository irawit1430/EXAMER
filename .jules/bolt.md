## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.
## 2024-05-18 - [Zustand Store Re-render Optimization Refactoring]
**Learning:** Destructuring entire Zustand stores (e.g. `const { user } = useAuthStore()`) causes unnecessary component re-renders whenever *any* state in the store changes.
**Action:** Always use fine-grained selectors (e.g. `const user = useAuthStore((s) => s.user)`) instead of destructuring the whole store object.
