## 2026-04-12 - Extracted ChatMessage to prevent re-renders
**Learning:** Found a performance bottleneck where `dialogueHistory.map` was re-rendering all historical chat messages every time a new message chunk arrived during streaming.
**Action:** Extract the chat message block into a new `ChatMessage` component wrapped in `React.memo()`. This ensures that previous messages in the array aren't unnecessarily re-rendered. Always ensure to write comments explaining the optimization.
