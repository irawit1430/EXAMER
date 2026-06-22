
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).

## 2024-04-26 - Custom Selection Toggles and ARIA Pressed State
**Learning:** In the onboarding flow and mock test taking interface, custom `<button>` elements styled as selectable cards or options do not natively convey their toggle state to screen readers. They only use visual cues (e.g. `border-brand-primary`).
**Action:** Always append the `aria-pressed={isSelected}` attribute to buttons that act as toggles or selectable options to ensure their active state is exposed to assistive technologies. Additionally, ensure these custom buttons include keyboard focus styles (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`).
