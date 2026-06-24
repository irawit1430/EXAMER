
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-06-24 - Screen Reader Announcements and AnimatePresence
**Learning:** When using `AnimatePresence` to dynamically reveal explanation content (e.g., in `ConceptCard` or `FeedbackCard`), placing an `aria-live="polite"` attribute directly on the `motion.div` inside `AnimatePresence` causes screen readers to miss announcements because the element itself mounts/unmounts.
**Action:** Always wrap dynamically revealed content in a persistent `<div aria-live="polite">` container *outside* of the `AnimatePresence` component. Additionally, ensure the button toggling the content has an appropriate `aria-expanded` attribute, and use `aria-pressed` for quiz options acting as toggle selections.
