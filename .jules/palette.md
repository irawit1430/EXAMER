## 2024-05-18 - Icon-Only Button Accessibility
**Learning:** Icon-only close buttons in `Modal` and mobile `Sidebar` components lacked `aria-label` attributes for screen readers and did not utilize `focus-visible` utility classes for keyboard navigation clarity.
**Action:** When implementing or reviewing icon-only buttons across the application, ensure `aria-label` and `focus-visible` ring styling are explicitly defined.
