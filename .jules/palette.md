## 2024-05-14 - Icon Button Accessibility
**Learning:** Icon-only close and notification buttons in modal, sidebar, and navbar components were missing proper ARIA labels and/or keyboard focus states (`focus-visible:ring-2`), hindering screen reader users and keyboard navigation.
**Action:** Always ensure that any icon-only interactive element includes both an descriptive `aria-label` and explicit `focus-visible` styles so that keyboard navigation remains clear.
