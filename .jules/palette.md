
## 2024-04-25 - Icon-only Buttons and Default Focus Styles
**Learning:** In the `examer` design system, the default `<button>` component and raw HTML buttons (like the `Modal` and `Sidebar` close buttons) lack inherent keyboard `focus-visible` styles. Furthermore, icon-only buttons often omit the essential `aria-label` attribute, making them completely inaccessible to screen readers.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to any interactive element that lacks a focus state, and explicitly add `aria-label` attributes to any button where the child content is purely decorative or an icon component (e.g., `<X />`).
## 2024-05-14 - Keyboard Navigation in Onboarding Selection Buttons
**Learning:** Raw `<button>` elements used as interactive cards or selection lists (e.g., in the `OnboardingFlow` steps like `Step2MCQTest`, `Step3FavoriteSubject`, etc.) lack inherent focus states. This prevents keyboard users from seeing which option they have currently focused on before selecting it.
**Action:** When creating custom interactive buttons that act as selection cards or list items, always apply the design system's default keyboard focus styles by appending `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` to the element's class list.
