## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.

## 2024-05-20 - [Zustand Store Re-render Optimization in useActiveRecall and StudyPage]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. This causes the component using the hook to re-render whenever ANY property in the store changes, even properties it doesn't use. This is particularly problematic in hooks like `useActiveRecall` and components like `StudyPage` where the timer updates every second.
**Action:** Used fine-grained individual selectors (e.g., `const prop = useStudyStore(state => state.prop)`) instead of destructuring the store object (e.g., `const { prop } = useStudyStore()`) to prevent unnecessary component re-renders when other state in the store changes.

## 2024-04-27 - [Syllabus Tree Lookup Performance]
**Learning:** The `syllabusTree.tree` structure contains nested arrays of subjects, topics, subtopics, and microConcepts. Deep nesting loop logic `(subject -> topic -> subTopic -> mc)` inside `.map` functions or `useEffect` can cause severe `O(N * M)` performance bottlenecks.
**Action:** When mapping array elements against the syllabus tree (like dashboard weak topics or recent activity), always pre-calculate a single flat `Array` or a lookup `Map` (using the pattern `id || name?.toLowerCase().replace(/\s+/g, '-')`) outside the loop to reduce iteration to `O(N + M)` with `O(1)` access time.
