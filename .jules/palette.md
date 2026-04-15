
## 2024-05-18 - Establish baseline for custom interactive elements
**Learning:** Found multiple instances where custom components (like `Toggle` mimicking a switch, and icon-only close buttons in modals/sidebars) lacked fundamental keyboard accessibility states (`focus-visible` styles) and essential semantic ARIA markup (`role`, `aria-checked`, `aria-label`).
**Action:** Always verify that custom interactive components built with `<div>` or unlabelled `<button>` elements have appropriate ARIA roles/attributes and visible focus rings explicitly implemented. Establish this as a baseline accessibility pattern for this application.
