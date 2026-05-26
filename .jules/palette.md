
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-15 - Dynamic Content Accessibility
**Learning:** In the `examer` design system, dynamically revealed content (like explanations or feedback after selecting an MCQ option) can go unnoticed by screen reader users if not properly announced. Furthermore, toggle buttons controlling this content need proper ARIA attributes to indicate their state.
**Action:** When implementing toggle buttons for dynamic content, always use `aria-expanded` to communicate the expanded/collapsed state. Additionally, wrap the dynamically revealed content in an `aria-live="polite"` container so that screen readers announce the new content without aggressively interrupting the user's current flow. For selectable options (like MCQ choices), use `aria-pressed` to indicate selection state, and always ensure custom interactive elements have standard `focus-visible` utility classes for keyboard navigation.
