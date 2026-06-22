
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).
## 2024-05-18 - Ensure aria-pressed and aria-expanded semantics
**Learning:** For interactive quiz options that act as toggleable selections, always use the `aria-pressed` attribute to communicate state to screen readers. For buttons that toggle dynamically revealed explanations or feedback, use the `aria-expanded` attribute, and wrap the content in an `aria-live="polite"` container so they are audibly notified without interrupting the user.
**Action:** When creating toggle buttons or dynamically revealed content, always ensure the appropriate ARIA attributes are set correctly.
