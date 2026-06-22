
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2025-05-18 - Accessible Toggle Buttons and Framer Motion
**Learning:** For interactive quiz options acting as toggleable selections, `aria-pressed` must be used to communicate state to screen readers. For buttons revealing dynamic content, `aria-expanded` is required, and the content must be in an `aria-live="polite"` container. Crucially, when using Framer Motion's `AnimatePresence`, the `aria-live="polite"` wrapper MUST be placed outside `AnimatePresence` to guarantee screen readers announce the content despite it unmounting.
**Action:** Always implement `aria-pressed` for switch-like selections, and `aria-expanded` coupled with an external `aria-live` wrapper for content conditionally mounted via `AnimatePresence`.
