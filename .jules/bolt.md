## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2024-05-20 - [Zustand Store Re-render Optimization in useActiveRecall and StudyPage]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. This causes the component using the hook to re-render whenever ANY property in the store changes, even properties it doesn't use. This is particularly problematic in hooks like `useActiveRecall` and components like `StudyPage` where the timer updates every second.
**Action:** Used fine-grained individual selectors (e.g., `const prop = useStudyStore(state => state.prop)`) instead of destructuring the store object (e.g., `const { prop } = useStudyStore()`) to prevent unnecessary component re-renders when other state in the store changes.

## 2024-05-23 - [O(1) Map Lookup for Deep Nested Arrays]
**Learning:** React component render logic or `useEffect` loops that traverse a deep nested structure (like a multi-level `syllabusTree` with Subject -> Topic -> SubTopic -> MicroConcept) multiple times inside map iterations (e.g. `weakTopics.map()`) cause severe O(N^4) performance degradation as the data grows.
**Action:** Always pre-calculate a single flattened representation of the structure (e.g., an array for iterative slicing and a `Map` for key-based lookup) in an O(N) pass, then use the Map for O(1) lookups during state mappings or renderings to drastically reduce loop iterations.
