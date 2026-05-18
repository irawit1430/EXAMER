
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2026-05-18 - Improve accessibility and focus states for Active Recall quiz
**Learning:** Custom interactive elements (like the options in `ActiveRecallBox`) need explicit `focus-visible` styling (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`) to be keyboard-navigable and accessible. Additionally, when explanations appear dynamically on screen after an interaction (like checking an answer), wrapping them in an `aria-live="polite"` container ensures screen readers announce the newly revealed content without interrupting the user. `aria-pressed` should be used for elements that function as toggles.
**Action:** When creating new custom interactive components or modifying existing ones, ensure focus styles are present and dynamic feedback is wrapped in `aria-live` containers.
