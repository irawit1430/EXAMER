## 2024-05-24 - Accessible Interactive Options
**Learning:** Custom toggle buttons and interactive option cards need `aria-pressed` to communicate their state to screen readers. Focus styles (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`) are essential for keyboard navigation visibility.
**Action:** Always add `aria-pressed` and `focus-visible` styles when building selectable option cards or custom toggles.
