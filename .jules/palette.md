
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-11 - Missing Custom Toggle Roles and Implicit Labels
**Learning:** Custom interactive components like `Toggle` are frequently missing appropriate ARIA roles (e.g., `role="switch"`) and states (`aria-checked`, `aria-label`). Also, many custom forms do not implicitly associate `<label>` elements with their respective inputs (missing `id` and `htmlFor`), making them inaccessible for screen reader users.
**Action:** When inspecting interactive components and forms in this design system, verify that they include explicit ARIA roles/states, that all inputs have `id` attributes matched with a `htmlFor` attribute on their associated labels, and that custom components accept `ariaLabel` props to be forwarded correctly.
