
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-02 - Accessible Quiz Options and Dynamic Feedback
**Learning:** Interactive quiz options acting as toggleable selections lacked state communication for screen readers, and dynamically revealed explanations appeared silently without interrupting the user.
**Action:** Always use the `aria-pressed` attribute on interactive toggle options to communicate their selected state to screen readers. Furthermore, wrap any dynamically revealed feedback or explanation text in an `aria-live="polite"` container so that screen readers announce the newly added content.
