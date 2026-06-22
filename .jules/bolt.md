## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2024-05-20 - [Zustand Store Re-render Optimization in useActiveRecall and StudyPage]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. This causes the component using the hook to re-render whenever ANY property in the store changes, even properties it doesn't use. This is particularly problematic in hooks like `useActiveRecall` and components like `StudyPage` where the timer updates every second.
**Action:** Used fine-grained individual selectors (e.g., `const prop = useStudyStore(state => state.prop)`) instead of destructuring the store object (e.g., `const { prop } = useStudyStore()`) to prevent unnecessary component re-renders when other state in the store changes.

## 2024-06-02 - [Zustand Store Re-render Optimization for AI Mentor Streaming]
**Learning:** During AI mentor streaming (`startStreamingMentor`), the `streamBuffer` in `useMentorStore` updates very frequently (on every token chunk). Any component that accesses `useMentorStore` without fine-grained selectors (e.g., using `const { isStreaming } = useMentorStore();`) will re-render completely on every single token chunk, leading to severe application-wide performance bottlenecks.
**Action:** Always use fine-grained individual selectors when accessing `useMentorStore` (e.g., `const isStreaming = useMentorStore(s => s.isStreaming)`) to prevent components from re-rendering due to unrelated high-frequency state changes like `streamBuffer` updates.
