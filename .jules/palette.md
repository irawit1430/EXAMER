
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-06-07 - Accessibility for Interactive Assessment Cards
**Learning:** For interactive assessment cards (like MCQ choices, explanations, and concept toggles), simply creating buttons with click handlers is insufficient. Screen readers need context about the state of these buttons. Using `aria-expanded` and `aria-pressed` makes the state programmatically determinable.
**Action:** When creating toggle sections (e.g. "Show Explanation"), use `aria-expanded` and wrap conditionally rendered children in `<div aria-live="polite">` (crucially, place this *outside* any animation component like `AnimatePresence`). For MCQ options acting as toggleable selections, use `aria-pressed`. Always apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to ensure keyboard accessibility.
