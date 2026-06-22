
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-24 - Interactive Mentor Message Accessibility
**Learning:** `MentorMessage.tsx` dynamically renders complex interactive elements like multiple-choice quizzes (`MCQCard`) and feedback toggles (`FeedbackCard`) using markdown parsing rather than separate page routes. These inline micro-interactions are highly prone to accessibility oversights since they are generated on the fly.
**Action:** When working on interactive components embedded in rich text or chat interfaces, explicitly verify that toggleable elements include `aria-pressed`, expand/collapse buttons include `aria-expanded`, and any newly revealed content blocks are wrapped in `aria-live="polite"` to alert screen readers gracefully without disrupting the chat flow.
