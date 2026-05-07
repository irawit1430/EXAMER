
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).
## 2026-05-07 - ARIA Live Regions for Dynamic Explanations
**Learning:** In the `ActiveRecallBox` component, explanations are conditionally rendered after a user selects an option. Since these DOM nodes are inserted dynamically, screen readers often fail to announce their appearance automatically, leaving visually impaired users unaware of the feedback.
**Action:** Always wrap conditionally rendered text feedback (like quiz explanations or error messages) in a persistent, static container with `aria-live="polite"`. This ensures that when the inner content is mounted, screen readers will queue and announce the text updates without interrupting the user's current flow.
