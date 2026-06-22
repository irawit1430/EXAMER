
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-04-26 - Accessible Toggle Buttons and Revealed Content
**Learning:** For interactive quiz options that act as toggleable selections, relying on visual state is insufficient. Screen readers need explicit state communication. Furthermore, when content is dynamically revealed via animations (like AnimatePresence), screen readers may fail to announce it.
**Action:** Always use the `aria-pressed` attribute for toggleable quiz options. For buttons that toggle dynamically revealed explanations or feedback, use the `aria-expanded` attribute, and wrap the content in an `aria-live="polite"` container *outside* the AnimatePresence component to ensure reliable screen reader announcements.
