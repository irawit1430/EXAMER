
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-15 - Dynamic Reveals and Interactive Quiz Toggles
**Learning:** For interactive quiz options acting as toggleable selections, `aria-pressed` must be used to communicate state to screen readers. Furthermore, dynamically revealed explanations (like feedback sections) using `AnimatePresence` must be wrapped in a static `aria-live="polite"` container positioned *outside* the `AnimatePresence` block. Otherwise, when elements unmount, screen readers will fail to announce the changes properly.
**Action:** Always add `aria-pressed` for option buttons, `aria-expanded` for explanation toggle buttons, and wrap dynamically revealed explanations in `aria-live="polite"`, placing it outside of React animation wrappers like `AnimatePresence`.
