## 2024-04-10 - [Zustand Store Re-render Optimization]
**Learning:** Calling a Zustand store hook like `useStudyStore()` without a selector returns the entire state object. If any property in the store changes (like a timer ticking every second), the component using the hook re-renders completely. This happens even if the component only needed an action function (e.g., `startStudySession`).
**Action:** Always use shallow selectors or destructure specific properties when consuming Zustand stores, especially if the store contains frequently updating state. For example: `const { startStudySession } = useStudyStore();`.
## 2024-05-18 - [ReactMarkdown Components Re-render Optimization]
**Learning:** Defining the `components` prop object inline within a `<ReactMarkdown>` tag causes React to unmount and remount the entire Markdown DOM tree on every component render. If the parent component re-renders frequently (e.g. updating a timer state every second), this results in severe performance bottlenecks due to constant DOM recreation.
**Action:** Always define the `components` override object outside the React component's render cycle to ensure object referential stability.
