## 2024-05-18 - Accessibility Improvements for Interactive Messages
**Learning:** Interactive components returned from the AI mentor (Concept Cards, MCQ checks, Feedback cards) use custom button toggles and dynamically revealed content. Screen readers struggle with AnimatePresence conditionally rendering content and interactive list options lacking pressed states.
**Action:** Always add `aria-expanded` and standard `focus-visible` to custom toggle buttons. Wrap dynamically revealed animated content with an `aria-live="polite"` container *outside* the AnimatePresence block. Use `aria-pressed` for selectable list options.

## 2024-05-18 - Semantic Toggles for Interactive Options
**Learning:** For interactive multiple choice options, using `aria-pressed` technically implies a toggle button. However, for mutually exclusive selections, `role="radio"` combined with `aria-checked` provides better semantic clarity to screen readers than `aria-pressed`. This distinction between a toggle vs. an exclusive choice is critical for accessible forms.
**Action:** When implementing single-select interactive options (like MCQs), prioritize using `role="radio"` and `aria-checked` over `aria-pressed`.
