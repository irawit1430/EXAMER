## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-15 - Interactive Quiz and Dynamic Content Accessibility
**Learning:** Interactive quiz options in MCQ tests function as toggleable choices but lack `aria-pressed` to announce their state to screen readers. Also, dynamically revealed explanations do not communicate their visibility change robustly, especially when paired with `AnimatePresence`.
**Action:** Use `aria-pressed` for toggle buttons. For dynamically revealed content with an explanation toggle button, add `aria-expanded` to the button and wrap the revealed content in an `aria-live="polite"` container positioned outside of the `AnimatePresence` so it doesn't unmount unpredictably.
