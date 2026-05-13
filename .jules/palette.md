
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).
## 2024-05-13 - Form Controls and Custom Toggles Accessibility
**Learning:** In the `examer` design system, custom inputs and interactive elements need explicit semantic ties for accessibility. Specifically:
- Inputs lack explicit `id` attributes and their corresponding `<label>` tags lack `htmlFor` attributes, resulting in screen readers not associating the two.
- Custom toggle buttons are built with standard `<button>` tags without a defined role (`role="switch"`), current state (`aria-checked`), or identifiable label (`aria-label`). They also miss standard keyboard focus styling (`focus-visible` ring classes).
**Action:** Always provide explicit `id` attributes on form inputs (text, number, select) and ensure `<label>` tags explicitly associate with them using `htmlFor` to prevent silent accessibility failures for screen readers. For custom toggles or switches built with buttons, always include `role="switch"`, `aria-checked`, `aria-label`, and standard `focus-visible` styling (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`).
