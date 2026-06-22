
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).
## 2024-03-24 - Form Label Accessibility
**Learning:** Custom forms in this application frequently omit explicit `htmlFor` attributes on `<label>` elements and matching `id` attributes on `<input>` elements. This breaks screen reader associations and reduces the clickable area for users.
**Action:** When creating or modifying forms, always ensure explicit `<label htmlFor="id">` and `<input id="id">` bindings are present.
