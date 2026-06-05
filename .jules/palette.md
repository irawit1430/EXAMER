
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-15 - ARIA States on Interactive Components
**Learning:** In the `examer` design system, custom interactive elements (like toggle buttons and selectable options) must correctly communicate their current state to screen readers. Buttons that reveal content should use `aria-expanded`, while buttons that act as toggleable selections (like MCQs) must use `aria-pressed`. Without these, screen reader users cannot perceive the dynamic state of the interface.
**Action:** Always append dynamic ARIA attributes (`aria-expanded`, `aria-pressed`, etc.) to custom interactive components that handle state, in addition to appending `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element lacking a focus state.
