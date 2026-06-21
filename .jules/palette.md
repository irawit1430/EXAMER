
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-05-21 - Active Recall Quiz Accessibility
**Learning:** For interactive quiz options that act as toggleable selections, relying on visual changes (like border and background colors) is insufficient for screen readers. Furthermore, dynamically revealed content like explanations needs to be announced automatically without user interaction.
**Action:** Always use the `aria-pressed` attribute on toggleable buttons (e.g., `aria-pressed={selectedOption === option.id}`) to communicate selection state to screen readers. Wrap dynamically revealed explanations or feedback in an `aria-live="polite"` container so they are audibly notified without interrupting the user. Also, ensure all interactive buttons have standard keyboard focus styles (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`).
