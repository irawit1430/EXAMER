## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2024-05-20 - [Zustand Store Re-render Optimization in useActiveRecall and StudyPage]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. This causes the component using the hook to re-render whenever ANY property in the store changes, even properties it doesn't use. This is particularly problematic in hooks like `useActiveRecall` and components like `StudyPage` where the timer updates every second.
**Action:** Used fine-grained individual selectors (e.g., `const prop = useStudyStore(state => state.prop)`) instead of destructuring the store object (e.g., `const { prop } = useStudyStore()`) to prevent unnecessary component re-renders when other state in the store changes.

## 2024-05-24 - [Zustand Store Re-render Optimization for useMentorStore]
**Learning:** During AI streaming, `useMentorStore` continuously updates its `streamBuffer` property on every token chunk. Components accessing this store via destructuring without selectors (e.g., `const { currentDialogue } = useMentorStore();`) will re-render on every token update, even if they don't consume `streamBuffer` directly. This can cause severe application-wide re-render bottlenecks.
**Action:** Any component accessing `useMentorStore` must strictly use fine-grained individual selectors (e.g., `const prop = useMentorStore(state => state.prop)`) rather than destructuring the store object.
