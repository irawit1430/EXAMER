## 2024-05-19 - Accessible Custom Toggles
**Learning:** Custom UI toggle buttons without `role="switch"` or dynamic `aria-checked` states are invisible to screen readers as actionable toggle elements.
**Action:** When creating or modifying custom toggle components, always include `role="switch"`, `aria-checked`, a descriptive `aria-label`, and `focus-visible` styling (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`) to ensure screen reader compatibility and clear visual keyboard focus.
