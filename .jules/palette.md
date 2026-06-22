
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-06-08 - Accessible Dynamic Revealed Content with AnimatePresence
**Learning:** When using Framer Motion's `AnimatePresence` for dynamically revealed explanations or feedback content, placing an `aria-live="polite"` wrapper *inside* the `AnimatePresence` component can cause issues, as the content and its wrapper may unmount before the screen reader finishes announcing.
**Action:** Always wrap the dynamically revealed content in an `aria-live="polite"` container, but ensure this wrapper is placed *outside* the `AnimatePresence` component to ensure screen readers reliably announce the content despite unmounting.
