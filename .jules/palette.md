
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).
## 2024-05-04 - Expand/Collapse and Toggle Button Accessibility
**Learning:** In the `MentorMessage` component, there are interactive buttons that act as toggles for expanding/collapsing content (like the explanation) or selecting options (like MCQ answers). These lack native ARIA attributes to communicate their state to screen readers.
**Action:** When implementing expand/collapse toggles, always include `aria-expanded` and link it to the content using `aria-controls` with a matching `id`. For buttons that function as stateful toggles (like selecting an option), use `aria-pressed` to indicate whether it is currently selected.
