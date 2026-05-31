
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-18 - Screen Reader Accessibility for React Framer Motion AnimatePresence
**Learning:** When using Framer Motion's `AnimatePresence` to dynamically reveal content (like explanations or feedback), screen readers often fail to announce the newly mounted content reliably. Wrapping the revealed content with an `aria-live="polite"` container inside the `AnimatePresence` block does not always work because the content itself is what gets mounted/unmounted.
**Action:** Always wrap the `aria-live="polite"` container *outside* the `AnimatePresence` component to ensure the region is always present in the DOM, allowing screen readers to reliably detect and announce the content when it is mounted inside. Additionally, ensure buttons that trigger these reveals have the appropriate `aria-expanded` and `focus-visible:ring-2` focus styling.
