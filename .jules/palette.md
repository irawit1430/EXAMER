
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2025-05-24 - Explicit Label Associations
**Learning:** Proper accessibility requires explicit label associations using the `htmlFor` attribute on `<label>` elements pointing to the respective input/select `id` attribute, even when the label text and input are somewhat visually adjacent.
**Action:** When creating forms, always provide `id` attributes on form inputs (text, number, select) and ensure `<label>` tags explicitly associate with them using `htmlFor`. This avoids silent accessibility failures where screen readers or click-focus behavior cannot determine the association.
