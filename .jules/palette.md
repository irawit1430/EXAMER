
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2026-05-03 - Explicit Input IDs for Accessibility
**Learning:** Inputs without explicit `id`s and corresponding `htmlFor` on labels fail accessibility standards, even when the input visually follows the label or uses nested components. Screen readers rely on explicit associations.
**Action:** Always ensure inputs have unique `id` attributes and labels use `htmlFor` pointing to those IDs to ensure full accessibility.
