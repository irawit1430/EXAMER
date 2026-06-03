
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-15 - Interactive Quiz and Explanatory Options Accessibility
**Learning:** For interactive quiz options that act as toggleable selections, always use the `aria-pressed` attribute to communicate state to screen readers. For buttons that toggle dynamically revealed explanations or feedback, use the `aria-expanded` attribute, and wrap the content in an `aria-live="polite"` container. Crucially, when using `AnimatePresence` for this revealed content, place the `aria-live="polite"` wrapper *outside* the `AnimatePresence` component to ensure screen readers reliably announce the content despite unmounting. Ensure these custom interactive elements maintain standard `focus-visible` styles.
**Action:** Always implement `aria-pressed` and `aria-expanded` alongside `aria-live` containers for dynamic content revelation, preserving keyboard focus styling.
