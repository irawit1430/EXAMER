
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-18 - ARIA Live and ARIA Pressed in Quizzes
**Learning:** For active recall or quiz components where options act as toggleable selections and explanations are dynamically revealed, default HTML buttons aren't enough for screen readers. A selected option requires `aria-pressed="true"` for state communication, and newly appearing textual explanations require an `aria-live="polite"` region so the user is audibly notified without interrupting their current flow.
**Action:** Always include `aria-pressed` on interactive quiz options that store a selected state, and wrap dynamically appearing feedback or explanations in an `aria-live="polite"` container.
