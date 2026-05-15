## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2024-05-20 - [Zustand Store Re-render Optimization in useActiveRecall and StudyPage]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. This causes the component using the hook to re-render whenever ANY property in the store changes, even properties it doesn't use. This is particularly problematic in hooks like `useActiveRecall` and components like `StudyPage` where the timer updates every second.
**Action:** Used fine-grained individual selectors (e.g., `const prop = useStudyStore(state => state.prop)`) instead of destructuring the store object (e.g., `const { prop } = useStudyStore()`) to prevent unnecessary component re-renders when other state in the store changes.

## 2024-05-24 - [O(N*M) Loop Optimization using Pre-calculated Lookup Maps in Dashboard]
**Learning:** In React components like `DashboardPage` (`src/app/(dashboard)/dashboard/page.tsx`), doing complex deep tree traversals and array mappings inside a `.map` operation over network-fetched array results in significant processing overhead, especially since the UI blocks while these arrays calculate.
**Action:** Always pre-calculate flattened arrays (like `flatConcepts`) and dictionary lookup Maps (`conceptLookup`) beforehand if the same nested structure is queried multiple times. Lookups against a pre-populated `Map` are O(1) compared to O(N*M) nested traversals.
